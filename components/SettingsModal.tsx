
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const json = await dbService.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whimsyyy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        await dbService.importFromJSON(json);
        alert("Data restored successfully! The app will reload.");
        window.location.reload();
      } catch (err) {
        console.error("Import failed", err);
        alert("Failed to import data. Please ensure the file is a valid Whimsyyy backup.");
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleClearData = async () => {
    if (window.confirm("Are you sure? This will permanently delete all your posts and local data. This cannot be undone.")) {
      try {
        await dbService.clearDatabase();
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        alert("Failed to clear database.");
      }
    }
  };

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

            {/* Database Management Section */}
            <section className="border-t border-border pt-8">
                <div className="flex items-center gap-2 mb-4">
                    <Database size={18} className="text-primary-light" />
                    <h3 className="font-bold text-foreground uppercase text-xs tracking-wider">Data Management</h3>
                </div>
                <p className="text-xs text-muted mb-4">Control your local SNS database. Back up your posts or restore from a file.</p>
                
                <div className="space-y-3">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-4 bg-surface-highlight/30 border border-border rounded-xl hover:bg-surface-highlight hover:border-primary/30 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Download size={18} className="text-muted group-hover:text-primary-light" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Export Data</p>
                                <p className="text-[10px] text-muted">Download all posts as JSON</p>
                            </div>
                        </div>
                        {isExporting && <Loader2 size={16} className="animate-spin text-primary" />}
                    </button>

                    <button
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="w-full flex items-center justify-between p-4 bg-surface-highlight/30 border border-border rounded-xl hover:bg-surface-highlight hover:border-primary/30 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Upload size={18} className="text-muted group-hover:text-primary-light" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Restore Data</p>
                                <p className="text-[10px] text-muted">Upload a Whimsyyy backup file</p>
                            </div>
                        </div>
                        {isImporting && <Loader2 size={16} className="animate-spin text-primary" />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />

                    <div className="pt-4 mt-4 border-t border-border/50">
                        <button
                            onClick={handleClearData}
                            className="w-full flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 hover:border-red-500/40 transition-all group"
                        >
                            <Trash2 size={18} className="text-red-400" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-red-400">Wipe Database</p>
                                <p className="text-[10px] text-red-400/60">Delete everything permanently</p>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-3 items-start">
                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-500/80 leading-relaxed">
                        Whimsyyy currently uses <strong>IndexedDB</strong> for local storage. Your data stays in this browser and is not uploaded to any cloud server unless you export it.
                    </p>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
