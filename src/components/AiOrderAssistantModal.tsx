import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Plus,
  Loader2,
  HelpCircle,
  Calculator,
  Utensils,
  CheckCircle2,
} from 'lucide-react';
import { MenuItem, CartItem } from '../types';

interface AiOrderAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem, quantity?: number, selectedVariant?: { label: string; price: number }) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestedItems?: Array<{
    name: string;
    variant?: string;
    price: number;
    quantity: number;
  }>;
  calculatedTotal?: number;
}

const QUICK_PROMPTS = [
  'How much is Magharita Pizza Large?',
  'What sausages do you have and prices?',
  'Tell me about VIBOX boxes and prices',
  'What are the Crunchy Chicken options?',
  'Supu ya samaki na vyakula vya asili?',
  'Recommend a meal for 2 people with total',
];

export const AiOrderAssistantModal: React.FC<AiOrderAssistantModalProps> = ({
  isOpen,
  onClose,
  currency,
  menuItems,
  onAddToCart,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Karibu Olli's Pizza House & Take Aways! 👋\n\nI am your AI Order Assistant powered by our updated menu. You can ask me any questions about our dishes, check prices in TZS, ask for recommendations, or tell me what you want so I can calculate your exact total and prepare your order!",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build history
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/ai/order-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const modelMsg: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || "I've reviewed your request against our menu.",
        suggestedItems: data.suggestedItems,
        calculatedTotal: data.calculatedTotal,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error('AI assistant error:', err);
      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: "Samahani, here is what I can tell you from our Olli's menu: We serve Pizzas (from 8,000 TZS), Crunchy Chicken (from 5,000 TZS), Sausages, Burgers, and VIBOX Combos. Please ask specifically about any dish!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItemToCart = (
    suggested: { name: string; variant?: string; price: number; quantity: number },
    index: number
  ) => {
    // Locate the matching menu item in catalog
    const matchedItem = menuItems.find(
      (m) =>
        m.name.toLowerCase() === suggested.name.toLowerCase() ||
        m.name.toLowerCase().includes(suggested.name.toLowerCase()) ||
        suggested.name.toLowerCase().includes(m.name.toLowerCase())
    );

    if (matchedItem) {
      let selectedVariant: { label: string; price: number } | undefined = undefined;
      if (suggested.variant && matchedItem.variants && matchedItem.variants.length > 0) {
        const found = matchedItem.variants.find(
          (v) => v.label.toLowerCase() === suggested.variant?.toLowerCase()
        );
        if (found) {
          selectedVariant = found;
        }
      }

      onAddToCart(matchedItem, suggested.quantity || 1, selectedVariant);
    } else {
      // Create on-the-fly item for customized combo
      const fallbackItem: MenuItem = {
        id: `custom-ai-${Date.now()}`,
        name: suggested.name,
        category: 'Combo Packs & Boxes',
        stock: 50,
        icon: 'Utensils',
        price: suggested.price,
      };
      onAddToCart(fallbackItem, suggested.quantity || 1);
    }

    const key = `${suggested.name}-${suggested.variant || ''}-${index}`;
    setAddedItemIds((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [key]: false }));
    }, 2500);
  };

  return (
    <div
      id="ai-order-assistant-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="ai-order-assistant-modal"
        className="relative flex flex-col w-full max-w-2xl h-[90vh] max-h-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#d6e0db]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1f4d3e] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-emerald-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Olli's AI Order Assistant</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-400/20 text-emerald-200 rounded-full border border-emerald-400/30">
                  Updated Menu
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">Inquiries, recommendations & order totals in TZS</p>
            </div>
          </div>
          <button
            id="close-ai-assistant-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-[#f4f7f5] border-b border-[#e5ebe7] overflow-x-auto no-scrollbar flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#1f4d3e] shrink-0" />
          <span className="text-[11px] font-semibold text-[#5a6a60] uppercase tracking-wider shrink-0">
            Quick Ask:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#d1ded6] text-[#2c3e35] hover:bg-[#1f4d3e] hover:text-white hover:border-[#1f4d3e] transition-colors shrink-0 whitespace-nowrap shadow-xs disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafbfb]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-[#1f4d3e] text-white rounded-br-xs'
                    : 'bg-white text-[#1f2d26] border border-[#e2e8e4] rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>

              {/* Calculated Total Card */}
              {msg.calculatedTotal !== undefined && msg.calculatedTotal > 0 && (
                <div className="mt-2.5 max-w-[85%] w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold">
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      <span>Calculated Order Total:</span>
                    </div>
                    <span className="text-base font-bold text-emerald-900">
                      {currency} {msg.calculatedTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Suggested items action pills */}
              {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                <div className="mt-2.5 max-w-[85%] w-full space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#5a6a60] uppercase tracking-wider block">
                    Suggested Items (Tap to Add):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.suggestedItems.map((item, idx) => {
                      const key = `${item.name}-${item.variant || ''}-${idx}`;
                      const isAdded = !!addedItemIds[key];

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white border border-[#d6e0db] rounded-xl hover:border-[#1f4d3e] transition-colors shadow-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-[#1f2d26] truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[#697a70]">
                              {item.variant ? `${item.variant} • ` : ''}
                              <span className="font-semibold text-[#1f4d3e]">
                                {currency} {item.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddItemToCart(item, idx)}
                            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#1f4d3e] text-white hover:bg-[#16382d]'
                            }`}
                            title="Add item to your order"
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#697a70] bg-white border border-[#e2e8e4] px-3.5 py-2.5 rounded-2xl w-fit shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#1f4d3e]" />
              <span>Consulting Olli's menu and calculating prices...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#e2e8e4]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              id="ai-assistant-chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about pizzas, sausages, chicken, or calculate your order..."
              className="flex-1 px-4 py-2.5 text-sm bg-[#f4f7f5] border border-[#d6e0db] rounded-xl focus:outline-none focus:border-[#1f4d3e] focus:bg-white transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              id="ai-assistant-send-btn"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 bg-[#1f4d3e] text-white rounded-xl font-medium text-sm hover:bg-[#16382d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#7a8a80] px-1">
            <span>Official Olli's Pizza House & Take Aways menu data</span>
            <span>English & Swahili supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};
