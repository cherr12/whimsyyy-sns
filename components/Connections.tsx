import React from 'react';
import { PlatformConfig, PlatformType, User } from '../types';
import { Check, Plus, Twitter, Instagram, Youtube, Video, Hash } from 'lucide-react';

interface ConnectionsProps {
  platforms: PlatformConfig[];
  toggleConnection: (id: PlatformType) => void;
  currentUser: User;
}

// Helper to map string IDs to Lucide components
const getIcon = (id: PlatformType) => {
  switch (id) {
    case PlatformType.X: return Twitter;
    case PlatformType.INSTAGRAM: return Instagram;
    case PlatformType.YOUTUBE: return Youtube;
    case PlatformType.TIKTOK: return Video; 
    case PlatformType.THREADS: return Hash; 
    default: return Hash;
  }
};

const Connections: React.FC<ConnectionsProps> = ({ platforms, toggConnection, currentUser }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Platform Connections</h2>
        <p className="text-muted">Manage your social ecosystem.</p>
      </div>

      <div className="space-y-4">
        <div className="mb-4 text-sm font-medium text-muted uppercase tracking-wider pl-1">
            Connected Accounts
        </div>
        
        {platforms.filter(p => p.id !== PlatformType.OMNIPOST).map((platform) => {
            const Icon = getIcon(platform.id);
            
            return (
              <div 
                key={platform.id}
                className="flex items-center justify-between p-5 bg-surface border border-border rounded-xl hover:border-muted transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
                        platform.isConnected 
                        ? 'bg-surface-highlight border-border' 
                        : 'bg-surface border-border group-hover:border-muted'
                    }`}
                    style={{ borderColor: platform.isConnected ? platform.color : undefined }}
                  >
                    <Icon 
                        size={24} 
                        color={platform.isConnected ? platform.color : 'currentColor'} 
                        className={`transition-colors ${platform.isConnected ? '' : 'text-muted'}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{platform.name}</h3>
                    <p className="text-sm text-muted">
                      {platform.isConnected 
                        ? `Connected as @${platform.connectedHandle || currentUser.handle}` 
                        : 'Not connected'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleConnection(platform.id)}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center ${
                    platform.isConnected
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                      : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
                  }`}
                >
                   {platform.isConnected ? (
                    <>
                      <Check size={16} />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default Connections;