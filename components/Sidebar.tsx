97

import React, { useState, useRef, useEffect } from 'react';
import { Home, PenTool, Settings, Link2, User as UserIcon, Plus, Check, ChevronUp, LogOut, Lock, Trash2, Eye, EyeOff, ChevronDown, UserX, LogIn } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: 'feed' | 'compose' | 'connections';
  setActiveTab: (tab: 'feed' | 'compose' | 'connections') => void;
  currentUser: User;
  availableUsers: User[];
  onSwitchUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onToggleHideUser: (userId: string) => void;
  onAddAccount: () => void;
  onTogglePublicView: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  availableUsers, 
  onSwitchUser, 
  onDeleteUser,
  onToggleHideUser,
  onAddAccount,
  isPublicView,
  onTogglePublicView,
  onOpenSettings
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHiddenSectionOpen, setIsHiddenSectionOpen] = useState(false);
  
  // State for hidden admin login button
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const isLogoPressedRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click counting for 5-tap secret
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset hidden login state when switching modes
  useEffect(() => {
    if (!isPublicView) {
        setShowAdminLogin(false);
    }
  }, [isPublicView]);

  // Keyboard Shortcut Secret (Ctrl + Shift + L)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
              e.preventDefault();
              setShowAdminLogin(prev => !prev);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoClick = () => {
      if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
      }

      clickCountRef.current += 1;

      if (clickCountRef.current >= 5) {
          setShowAdminLogin(prev => !prev);
          clickCountRef.current = 0;
          return;
      }

      clickTimeoutRef.current = setTimeout(() => {
          clickCountRef.current = 0;
      }, 500);
  };

  const menuItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    ...(!!isPublicView ? [
        { id: 'compose', icon: PenTool, label: 'Create' },
        { id: 'connections', icon: Link2, label: 'Connections' },
    ] : []),
  ];

  const visibleUsers = availableUsers.filter(u => !u.isHidden || u.id === currentUser.id);
  const hiddenUsers = availableUsers.filter(u => u.isHidden && u.id !== currentUser.id);

  return (
        <div className="flex items-center gap-3 mb-8 px-2 select-none cursor-pointer group"
        onMouseDown={(e) => { e.preventDefault(); isLogoPressedRef.current = true; }}
        onClick={handleLogoClick}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${111
             ? 'bg-surface-highlight' : 'bg-primary text-white'}`}>
          <span className={`font-bold text-lg ${108
             ? 'text-primary' : 'text-white'}`}>W</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
                whimsyyy
        {isPublicView && <span onClick={(e) => { e.stopPropagation(); onTogglePublicView(); }} className="ml-2 text-xs font-normal text-muted border border-border rounded px-1.5 py-0.5 hover:bg-accent transition-colors cursor-pointer">Guest</span>}              <button 
        onClick={onTogglePublicView}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isPublicView 
            ? 'bg-surface-highlight' : 'bg-primary text-white'
        }`}
      >
        <span className={`font-bold text-lg ${
          isPublicView 
            ? 'text-primary' : 'text-white'
        }`}>W</span>
      </button>
      <h1 className="text-xl font-bold tracking-tight text-foreground cursor-pointer" onClick={onTogglePublicView}>
        whimsyyy
            {isPublicView && <span onClick={(e) => { e.stopPropagation(); onTogglePublicView(); }} className="ml-2 text-xs font-normal text-muted border border-border rounded px-1.5 py-0.5 hover:bg-accent transition-colors cursor-pointer">Guest</span>}      </h1>:139
            key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted hover:bg-surface-highlight hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border relative" ref={menuRef}>
        
        {!isPublicView ? (
            <button 
                onClick={onTogglePublicView}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors mb-2"
            >
                <LogOut size={20} />
                <span>Log Out</span>
            </button>
        ) : (
            <div className="flex flex-col gap-2">

                {/* HIDDEN ADMIN LOGIN - Revealed by secret state */}
                {showAdminLogin && (
                    <button 
                        onClick={onTogglePublicView}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl transition-colors mb-4 shadow-lg shadow-primary/20 animate-in slide-in-from-bottom-2 fade-in"
                    >
                        <Lock size={20} />
                        <span className="font-medium">Admin Login</span>
                    </button>
                )}
            </div>
        )}

        {!isPublicView && (
            <>
                {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 w-full mb-3 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-bold text-muted uppercase tracking-wider">
                        Active Accounts
                    </div>
                    
                    {visibleUsers.map((user) => (
                        <div key={user.id} className="group relative flex items-center">
                            <button
                                onClick={() => {
                                    onSwitchUser(user.id);
                                    setIsUserMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                    currentUser.id === user.id
                                    ? 'bg-primary/10 text-primary-light'
                                    : 'hover:bg-surface-highlight text-muted hover:text-foreground'
                                }`}
                            >
                                <div className="relative">
                                    <img 
                                        src={user.avatarUrl} 
                                        alt={user.name} 
                                        className={`w-8 h-8 rounded-full border :122
                                            user.isHidden ? 'border-dashed border-muted grayscale opacity-60' : 'border-border'}`} 
                                    />
                                    {user.isHidden && (
                                        <div className="absolute -top-1 -right-1 bg-surface rounded-full p-0.5">
                                            <UserX size={10} className="text-muted" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="text-sm font-medium truncate flex items-center gap-2">
                                        {user.name}
                                        {user.isHidden && <span className="text-[9px] bg-surface-highlight px-1 rounded text-muted">HIDDEN</span>}
                                    </div>
                                    <div className="text-xs text-muted truncate">@{user.handle}</div>
                                </div>
                                {currentUser.id === user.id && <Check size={16} className="text-primary" />}
                            </button>
                            
                            <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20 bg-surface/90 backdrop-blur rounded p-1 shadow-sm">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onToggleHideUser(user.id);
                                    }}
                                    className="p-1.5 text-muted hover:text-foreground hover:bg-surface-highlight rounded-md"
                                >
                                    {user.isHidden ? <Eye size={14} className="text-primary" /> : <EyeOff size={14} />}
                                </button>
                                {availableUsers.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onDeleteUser(user.id);
                                        }}
                                        className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {hiddenUsers.length > 0 && (
                        <div className="mt-2 border-t border-border/50 pt-1">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setIsHiddenSectionOpen(!isHiddenSectionOpen); }}
                                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-muted uppercase tracking-wider hover:text-foreground transition-colors"
                             >
                                 <span>Hidden ({hiddenUsers.length})</span>
                                 <ChevronDown size={12} className={`transition-transform ${isHiddenSectionOpen ? 'rotate-180' : ''}`} />
                             </button>
                             
                             {isHiddenSectionOpen && hiddenUsers.map((user) => (
                                 <div key={user.id} className="group relative flex items-center opacity-70 hover:opacity-100">
                                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:bg-surface-highlight/30">
                                        <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-border grayscale" />
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="text-sm font-medium truncate">{user.name}</div>
                                            <div className="text-xs text-muted truncate">@{user.handle}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute right-2 flex gap-1 z-10 bg-surface p-1 rounded">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onToggleHideUser(user.id);
                                            }}
                                            className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-md"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDeleteUser(user.id);
                                            }}
                                            className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                 </div>
                             ))}
                        </div>
                    )}

                    <div className="h-px bg-border/50 my-1"></div>
                    
                    <button
                        onClick={() => {
                        setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:bg-surface-highlight hover:text-foreground transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full border border-dashed border-muted flex items-center justify-center bg-surface-highlight">
                        <Plus size={16} />
                        </div>
                        <span className="text-sm font-medium">Add Account</span>
                    </button>
                    </div>
                </div>
                )}

                      {/* Sign In button - only visible in Guest mode */}
      {isPublicView && (
        <button
          onClick={() => onAddAccount()}
          className="w-full flex items-center gap-3 px-4 py-3 text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <LogIn className="h-5 w-5" />
          <span>Sign In</span>
        </button>
      )}
:1

                <button 
                  onClick={onOpenSettings}
                  className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-foreground transition-colors mb-1"
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </button>

                <button 
                onClick={() => setIsUserMenuOpen(!:170

                )}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border ${
                    isUserMenuOpen 
                    ? 'bg-surface border-border' 
                    : 'bg-surface/50 border-transparent hover:bg-surface hover:border-border'
                }`}
                >
                <img 
                    src={currentUser.avatarUrl} 
                    alt="User" 
                    className={`w-8 h-8 rounded-full border ${currentUser.isHidden ? 'border-dashed border-muted opacity-60 grayscale' : 'border-border'}`}
                />
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                        {currentUser.name}
                        {currentUser.isHidden && <span className="w-2 h-2 rounded-full bg-muted" title="Hidden"></span>}
                    </p>
                    <p className="text-xs text-muted truncate">@{currentUser.handle}</p>
                </div>
                <ChevronUp size={16} className={`text-muted transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
            </>
        )}
        
        {isPublicView && (
            <button 
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-foreground transition-colors mb-1 mt-2 border-t border-border pt-4"
            >
                <Settings size={20} />
                <span>Appearance</span>
            </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
109
