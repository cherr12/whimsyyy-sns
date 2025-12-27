
import React, { useState } from 'react';
import { X, LogIn, Mail, Lock, ShieldCheck, Chrome, AlertCircle, ExternalLink, Copy, Check, Info, RefreshCw, MoveRight } from 'lucide-react';
import { authService } from '../services/authService';
import { firebaseConfig } from '../firebaseConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (pin: string) => Promise<boolean>;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{title: string, detail: string, code?: string} | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDomain = window.location.hostname;
  const projectId = firebaseConfig.projectId;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      // loginWithGoogle now uses Redirect mode primarily
      await authService.loginWithGoogle();
      // Page will navigate away, so no need for further local UI state updates
    } catch (e: any) {
      console.error("Google login failed", e);
      setErrorMessage({
        title: "Login Initiation Failed",
        detail: e.message || "Could not start the login process.",
        code: e.code // Set the code to trigger domain auth help UI
      });
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (isRegister) {
        await authService.registerWithEmail(email, password);
      } else {
        await authService.loginWithEmail(email, password);
      }
      onClose();
    } catch (e: any) {
      setErrorMessage({
        title: "Authentication Error",
        detail: e.message || "Invalid credentials.",
        code: e.code
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground z-10">
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-bold text-foreground">{isRegister ? 'Join whimsyyy' : 'Welcome Back'}</h2>
          <p className="text-muted text-sm mt-1 text-center">Your cloud workspace, optimized by AI.</p>
        </div>

        {errorMessage && (
            <div className={`mb-6 rounded-xl overflow-hidden animate-in slide-in-from-top-2 border ${
                errorMessage.code === 'auth/unauthorized-domain' 
                ? 'bg-amber-500/5 border-amber-500/20' 
                : 'bg-red-500/5 border-red-500/20'
            }`}>
                <div className="p-4 flex gap-3">
                    <AlertCircle size={20} className={errorMessage.code === 'auth/unauthorized-domain' ? 'text-amber-500' : 'text-red-500'} />
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${errorMessage.code === 'auth/unauthorized-domain' ? 'text-amber-500' : 'text-red-500'}`}>
                            {errorMessage.title}
                        </p>
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                            {errorMessage.detail}
                        </p>
                    </div>
                </div>

                {errorMessage.code === 'auth/unauthorized-domain' && (
                    <div className="bg-amber-500/10 border-t border-amber-500/20 p-4 space-y-4">
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
                                <div className="flex-1">
                                    <p className="text-[11px] text-foreground font-medium mb-1.5">Copy current domain:</p>
                                    <div className="flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1.5 group">
                                        <code className="text-[10px] flex-1 truncate text-amber-200 font-mono">{currentDomain}</code>
                                        <button 
                                            onClick={handleCopyDomain}
                                            className="p-1 hover:bg-surface-highlight rounded transition-all text-muted hover:text-amber-500"
                                        >
                                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
                                <div className="flex-1">
                                    <p className="text-[11px] text-foreground font-medium mb-1.5">Authorize in Firebase:</p>
                                    <a 
                                        href={`https://console.firebase.google.com/project/${projectId}/authentication/settings`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 py-2.5 rounded-lg transition-all"
                                    >
                                        Open Console <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 border border-slate-200"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Chrome size={20} />}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-[10px] font-bold text-muted uppercase">or email</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input 
              type="email" 
              placeholder="Email address" 
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:border-primary outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:border-primary outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <button 
            onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage(null);
            }}
            className="w-full text-center text-xs text-primary-light hover:underline"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
