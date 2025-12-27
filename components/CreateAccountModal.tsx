import React, { useState, useRef } from 'react';
import { X, Camera, User, AtSign, Check } from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, handle: string, avatarFile: File | null) => void;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !handle) return;
    onSubmit(name, handle, avatarFile);
    // Reset form
    setName('');
    setHandle('');
    setAvatarFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors z-10"
        >
            <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Create Persona</h2>
            <p className="text-muted text-sm">Define a new identity for your content.</p>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              <div className="w-24 h-24 rounded-full bg-surface-highlight border-2 border-dashed border-muted flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-muted group-hover:text-primary-light transition-colors" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-4 border-surface text-white">
                <PlusIcon size={14} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <p className="mt-3 text-xs text-muted">Tap to upload avatar</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase ml-1">Display Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tech Reviewer"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase ml-1">Handle</label>
              <div className="relative">
                <AtSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_\u3130-\u318F\uAC00-\uD7AF]/g, ''))}
                  placeholder="tech_reviewer"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || !handle}
            className="w-full mt-8 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Check size={18} />
            <span>Create Account</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// Helper component for the plus icon
const PlusIcon = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default CreateAccountModal;