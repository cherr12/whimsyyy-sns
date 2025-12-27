import React from 'react';
import { PlatformConfig, PlatformType } from '../types';
import { Twitter, Instagram, Youtube, Video, Hash } from 'lucide-react';

interface PlatformToggleProps {
  platform: PlatformConfig;
  isSelected: boolean;
  onToggle: (id: PlatformType) => void;
}

// Helper to map string IDs to Lucide components
const getIcon = (id: PlatformType) => {
  switch (id) {
    case PlatformType.X: return Twitter; // X uses Twitter icon for now
    case PlatformType.INSTAGRAM: return Instagram;
    case PlatformType.YOUTUBE: return Youtube;
    case PlatformType.TIKTOK: return Video; // Proxy for Tiktok
    case PlatformType.THREADS: return Hash; // Proxy for Threads
    default: return Hash;
  }
};

const PlatformToggle: React.FC<PlatformToggleProps> = ({ platform, isSelected, onToggle }) => {
  const Icon = getIcon(platform.id);

  if (!platform.isConnected && platform.id !== PlatformType.OMNIPOST) {
    return null; 
  }

  return (
    <button
      onClick={() => onToggle(platform.id)}
      className={`relative group flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200 ${
        isSelected
          ? `bg-slate-800 border-${platform.color} shadow-[0_0_10px_rgba(99,102,241,0.3)]`
          : 'bg-transparent border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
      }`}
      style={{ borderColor: isSelected ? platform.color : undefined }}
      title={platform.name}
    >
      <Icon 
        size={20} 
        color={isSelected ? platform.color : '#94a3b8'} 
        className="transition-colors duration-200"
      />
      {isSelected && (
        <div 
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-green-500 border-2 border-slate-900"
        >
             <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
      )}
    </button>
  );
};

export default PlatformToggle;