import React, { useState, useEffect } from 'react';
import { PlatformConfig } from '../types';
import { X, ExternalLink, Shield, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (username: string) => void;
  platform: PlatformConfig | null;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, onConnect, platform }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen || !platform) return null;

  const handleOAuthLogin = () => {
    setStatus('connecting');
    // Simulate network request and OAuth redirect delay
    setTimeout(() => {
      setStatus('connected');
      // Simulate receiving the callback with auth token
      setTimeout(() => {
        const mockHandle = `${platform.name.toLowerCase().replace(/[^a-z]/g, '')}_official`;
        onConnect(mockHandle);
      }, 1000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors z-10"
        >
            <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          
          {/* Header Icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative">
             <div className="absolute inset-0 bg-current opacity-10 rounded-2xl" style={{ color: platform.color }}></div>
             <div className="w-10 h-10 rounded-full shadow-lg" style={{ backgroundColor: platform.color }}></div>
             
             {status === 'connected' && (
               <div className="absolute -bottom-2 -right-2 bg-green-500 text-slate-900 rounded-full p-1 border-4 border-surface animate-in zoom-in">
                 <CheckCircle2 size={20} />
               </div>
             )}
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {status === 'idle' && `Connect ${platform.name}`}
            {status === 'connecting' && `Contacting ${platform.name}...`}
            {status === 'connected' && `Successfully Connected!`}
          </h2>

          <p className="text-muted mb-8 max-w-[90%] text-sm leading-relaxed">
             {status === 'idle' && "You will be redirected to authorize Whimsy to access your account securely. We never see your password."}
             {status === 'connecting' && "Waiting for authorization from provider..."}
             {status === 'connected' && "Redirecting you back to the dashboard..."}
          </p>

          {status === 'idle' && (
            <div className="w-full space-y-5">
                {/* Permissions List */}
                <div className="bg-surface-highlight/50 rounded-xl p-4 text-left space-y-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Requested Permissions</p>
                        <Shield size={14} className="text-muted" />
                    </div>
                    <div className="flex items-center gap-3 text-foreground text-sm">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        <span>Read profile information</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground text-sm">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        <span>Create and publish content</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground text-sm">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        <span>Read analytics data</span>
                    </div>
                </div>

                {/* Disclaimer for Demo */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 items-start text-left">
                    <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-[11px] text-blue-200/70 leading-snug">
                        <strong>Demo Environment:</strong> Real OAuth connections require a backend server and API keys. This flow simulates the secure production behavior.
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleOAuthLogin}
                    className="w-full bg-foreground hover:opacity-90 text-background font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                >
                    <span>Continue with {platform.name}</span>
                    <ExternalLink size={18} />
                </button>
            </div>
          )}

          {status === 'connecting' && (
            <div className="py-8 flex flex-col items-center gap-4">
                <Loader2 size={48} className="text-primary animate-spin" style={{ color: platform.color }} />
                <span className="text-xs text-muted animate-pulse">Opening secure window...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;