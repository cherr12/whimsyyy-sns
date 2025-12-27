import React, { useRef, useState } from 'react';
import { X, Moon, Sun, LayoutGrid, Palette, Download, Upload, Trash2, Database, AlertCircle, Loader2 } from 'lucide-react';
import { Theme } from '../types';
import { dbService } from '../services/dbService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const themes: { id: Theme; name: string; icon: React.ElementType; color: string }[] = [
    { id: 'dark', name: 'Dark', icon: Moon, color: 'bg-slate-900' },
    { id: 'light', name: 'Light', icon: Sun, color: 'bg-white border-2 border-slate-200' },
    { id: 'green', name: 'Lego World', icon: LayoutGrid, color: 'bg-green-500 border-4 border-green-700' },
    { id: 'pink', name: 'Princess Paint', icon: Palette, color: 'bg-pink-300 border-2 border-black' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {/* Appearance Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette size={18} className="text-primary-light" />
              <h3 className="font-bold text-foreground uppercase text-xs tracking-wider">Appearance</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {themes.map((theme) => {
                const Icon = theme.icon;
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                      isActive 
                        ? 'border-primary bg-primary/10 scale-[1.02]' 
                        : 'border-border hover:border-primary/50 hover:bg-surface-highlight'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 shadow-lg ${theme.color}`}>
                      <Icon size={22} className={theme.id === 'light' ? 'text-slate-900' : 'text-white'} />
                    </div>
                    <span className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
