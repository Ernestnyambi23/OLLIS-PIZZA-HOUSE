import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { paymentGatewayService, PushRequest } from './src/server/paymentGateway';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// =========================================================================
// TILL CONFIGURATION WITH AUTO-ROUTING CHANNELS (PAYMENT CONTROLLER)
// =========================================================================

/**
 * 1. Automatic Push Trigger Endpoint
 * Matches POST /api/payments/auto-push from Java Spring Boot PaymentController
 */
app.post('/api/payments/auto-push', async (req, res) => {
  try {
    const { orderId, amount, customerPhone, tillKey } = req.body as PushRequest;

    if (!orderId || !amount || !customerPhone || !tillKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, amount, customerPhone, or tillKey',
      });
    }

    const response = await paymentGatewayService.triggerAutoPushNotification({
      orderId,
      amount: Number(amount),
      customerPhone: String(customerPhone),
      tillKey: String(tillKey),
    });

    return res.json(response);
  } catch (error: any) {
    if (error?.message === 'Invalid tillKey provided.') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tillKey provided.',
      });
    }

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * 2. Get Configured Merchant Tills
 */
app.get('/api/payments/tills', (_req, res) => {
  res.json({
    success: true,
    baseUrl: paymentGatewayService.getBaseUrl(),
    tills: paymentGatewayService.getTills(),
  });
});

/**
 * 3. Get Push Notification History
 */
app.get('/api/payments/history', (_req, res) => {
  res.json({
    success: true,
    history: paymentGatewayService.getHistory(),
  });
});

// Lazy-initialized Gemini AI client
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Payroll calculation interface
interface PayrollRequestItem {
  staffId?: string;
  staffName: string;
  monthlyGrossSalary: number;
  daysAbsent: number;
  month: number;
  year: number;
}

/**
 * Endpoint to calculate dynamic calendar-month staff payroll deductions
 * using Gemini API (with deterministic fallback formula)
 */
app.post('/api/payroll/calculate', async (req, res) => {
  try {
    const { items, month, year } = req.body as {
      items: PayrollRequestItem[];
      month: number;
      year: number;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid items array' });
    }

    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();
    // Dynamically calculate exact days in the calendar month (day 0 of next month)
    const totalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    const ai = getGeminiClient();
    const calculatedResults = [];

    for (const item of items) {
      const gross = Number(item.monthlyGrossSalary) || 0;
      const absent = Math.max(0, Math.min(totalDaysInMonth, Number(item.daysAbsent) || 0));
      const staffName = item.staffName || 'Staff Member';

      // Mathematical exact baseline:
      const fallbackDailyRate = Number((gross / totalDaysInMonth).toFixed(2));
      const fallbackDeduction = Number((fallbackDailyRate * absent).toFixed(2));
      const fallbackNetSalary = Number((gross - fallbackDeduction).toFixed(2));

      let calculatedDailyRate = fallbackDailyRate;
      let totalDeduction = fallbackDeduction;
      let netPayableSalary = fallbackNetSalary;
      let calculatedByAi = false;

      if (ai) {
        try {
          const prompt = `
            Calculate staff payroll deductions strictly based on calendar-month flow:
            - Staff Name: ${staffName}
            - Monthly Gross Salary: ${gross}
            - Days Absent: ${absent}
            - Target Month: ${targetMonth}/${targetYear}
            - Total Days in Month: ${totalDaysInMonth}

            Rules:
            1. Daily Rate = Monthly Gross Salary / ${totalDaysInMonth}
            2. Total Deduction = Daily Rate * Days Absent
            3. Net Payable Salary = Monthly Gross Salary - Total Deduction
            4. Return values rounded to 2 decimal places.
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  calculatedDailyRate: { type: Type.NUMBER },
                  totalDeduction: { type: Type.NUMBER },
                  netPayableSalary: { type: Type.NUMBER },
                },
                required: ['calculatedDailyRate', 'totalDeduction', 'netPayableSalary'],
              },
              temperature: 0.1,
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            if (
              typeof parsed.calculatedDailyRate === 'number' &&
              typeof parsed.totalDeduction === 'number' &&
              typeof parsed.netPayableSalary === 'number'
            ) {
              calculatedDailyRate = Number(parsed.calculatedDailyRate.toFixed(2));
              totalDeduction = Number(parsed.totalDeduction.toFixed(2));
              netPayableSalary = Number(parsed.netPayableSalary.toFixed(2));
              calculatedByAi = true;
            }
          }
        } catch (aiErr) {
          console.warn(`[Gemini Payroll API] Fallback to formula for ${staffName}:`, aiErr);
        }
      }

      calculatedResults.push({
        staffId: item.staffId,
        staffName,
        monthlyGrossSalary: gross,
        daysAbsent: absent,
        month: targetMonth,
        year: targetYear,
        totalDaysInMonth,
        calculatedDailyRate,
        totalDeduction,
        netPayableSalary,
        calculatedByAi,
      });
    }

    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      totalDaysInMonth,
      results: calculatedResults,
    });
  } catch (error) {
    console.error('Payroll API Error:', error);
    return res.status(500).json({
      error: 'Failed to compute staff payroll',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Restaurant System & AI Studio running on http://0.0.0.0:${PORT}`);
  });
}

start();
