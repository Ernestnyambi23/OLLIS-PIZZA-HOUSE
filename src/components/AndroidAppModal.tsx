import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Layers,
  Sparkles,
  Cpu,
  Share2,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BrandLogo } from './BrandLogo';
import { triggerHaptic } from '../utils/haptics';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
  isStandalone: boolean;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPwa,
  isStandalone,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'qr' | 'apk'>('install');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const cliCode = `# 1. Install Capacitor Android bridge
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize project
npx cap init "Olli's Pizza POS" com.ollis.pizza

# 3. Add Android Platform & Build APK
npx cap add android
npm run build
npx cap sync android

# 4. Open in Android Studio / Build Release APK
npx cap open android`;

  const handleCopyCli = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(cliCode);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-5">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#e2e4dc] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1f4d3e] text-white p-5 relative shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <BrandLogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">Android App Edition</h3>
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Android POS
                </span>
              </div>
              <p className="text-xs text-[#cfe0d7] mt-0.5">
                Run Olli's Pizza House natively on any Android device
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-black/25 p-1 rounded-xl mt-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('install');
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'install'
                  ? 'bg-white text-[#1f4d3e] shadow-xs'
                  : 'text-[#cfe0d7] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>1-Tap Install</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('qr');
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'qr'
                  ? 'bg-white text-[#1f4d3e] shadow-xs'
                  : 'text-[#cfe0d7] hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('apk');
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'apk'
                  ? 'bg-white text-[#1f4d3e] shadow-xs'
                  : 'text-[#cfe0d7] hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>APK Build</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-[#1b2620]">
          {/* TAB 1: 1-Tap Install on Android */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              {isStandalone ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">App Already Installed!</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      You are currently running Olli's Pizza House in full-screen standalone Android mode.
                    </p>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Direct Android Install Available</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    Tap the button below to install Olli's Pizza House directly to your Android home screen and app drawer as a standalone app.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('success');
                      onInstallPwa();
                    }}
                    className="w-full py-3 bg-[#1f4d3e] hover:bg-[#183d31] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on Android Now</span>
                  </button>
                </div>
              ) : null}

              {/* Android Chrome 3-Step Guide */}
              <div className="bg-[#f9f8f4] border border-[#e2e4dc] rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#738279] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#1f4d3e]" />
                  <span>How to Install on Any Android Device (Chrome / Edge / Samsung Internet)</span>
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-[#eceee7]">
                    <span className="w-6 h-6 rounded-full bg-[#1f4d3e] text-white text-xs font-black flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="text-xs">
                      <span className="font-bold text-[#1b2620]">Open browser menu:</span> Tap the{' '}
                      <span className="font-mono font-bold bg-gray-100 px-1 py-0.5 rounded">⋮ (three dots)</span> at the top-right of your Android browser.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-[#eceee7]">
                    <span className="w-6 h-6 rounded-full bg-[#1f4d3e] text-white text-xs font-black flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div className="text-xs">
                      <span className="font-bold text-[#1b2620]">Select Install:</span> Tap{' '}
                      <span className="font-bold text-[#1f4d3e]">"Install App"</span> or{' '}
                      <span className="font-bold text-[#1f4d3e]">"Add to Home screen"</span>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-[#eceee7]">
                    <span className="w-6 h-6 rounded-full bg-[#1f4d3e] text-white text-xs font-black flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div className="text-xs">
                      <span className="font-bold text-[#1b2620]">Launch & Order:</span> Olli's Pizza House icon will appear on your Android home screen and launch fullscreen with zero browser address bars.
                    </div>
                  </div>
                </div>
              </div>

              {/* Native Android Features Checklist */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900">Fullscreen POS View</span>
                </div>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900">Offline Cache Ready</span>
                </div>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900">Android Haptic Vibrate</span>
                </div>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-900">Multi-Terminal Sync</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Scan QR from Android Phone / Tablet */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-[#738279]">
                Scan this QR code with the camera on your Android phone, tablet, or handheld POS to open and install the app instantly.
              </p>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#1f4d3e]/20 inline-block shadow-sm mx-auto">
                {appUrl ? (
                  <QRCodeSVG
                    value={appUrl}
                    size={200}
                    level="H"
                    includeMargin
                    imageSettings={{
                      src: '/logo.jpg',
                      x: undefined,
                      y: undefined,
                      height: 44,
                      width: 44,
                      excavate: true,
                    }}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* Copy URL trigger */}
              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 bg-[#f4f5f0] border border-[#d6d8ce] rounded-xl px-3 py-2 text-xs font-mono text-[#1b2620] truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-[#1f4d3e] hover:bg-[#183d31] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Standalone Android APK Build */}
          {activeTab === 'apk' && (
            <div className="space-y-3">
              <div className="bg-[#f4f5f0] border border-[#e2e4dc] rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#1f4d3e]" />
                    <span className="text-xs font-bold text-[#1b2620]">
                      Compile Native Android APK (Capacitor)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCli}
                    className="text-[11px] font-bold text-[#1f4d3e] hover:text-[#183d31] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#d6d8ce]"
                  >
                    {copiedCli ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCli ? 'Copied Commands' : 'Copy Commands'}</span>
                  </button>
                </div>

                <pre className="bg-[#1b2620] text-[#a7f3d0] p-3 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed">
                  {cliCode}
                </pre>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Hardware Compatibility
                </span>
                <p className="text-[11.5px] text-blue-800">
                  Works seamlessly on Sunmi, PAX, Android POS terminals, tablets, and smartphones. Supports Bluetooth thermal printers and barcode scanners.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f9f8f4] border-t border-[#e2e4dc] p-4 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-[#738279] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for Android Tablets & Phones</span>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 bg-[#1b2620] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
