
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Composer from './components/Composer';
import Connections from './components/Connections';
import ConnectModal from './components/ConnectModal';
import CreateAccountModal from './components/CreateAccountModal';
import StoriesBar from './components/StoriesBar';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import { PlatformConfig, PlatformType, Post, User, Theme, Comment } from './types';
import { Menu, Globe, RefreshCw, AlertTriangle } from 'lucide-react';
import { authService } from './services/authService';
import { dbService } from './services/dbService';
import { isConfigValid } from './firebaseConfig';

function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'discovery' | 'compose' | 'connections'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPublicView, setIsPublicView] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

    // Auto-switch to Master mode when user logs in
      useEffect(() => {
            if (currentUser) {
                    setIsPublicView(false);
                        }
                          }, [currentUser]);
  
  const [theme, setTheme] = useState<Theme>('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState<{msg: string, type: 'success' | 'info'} | null>(null);

  // Handle Auth state and Redirect result
  useEffect(() => {
    // Proactively check for redirect result when returning from Google
    const initAuth = async () => {
      try {
          const user = await authService.handleRedirectResult();
          if (user) {
              console.log("Welcome back,", user.displayName);
              showNotification(`Signed in as ${user.displayName}`, 'success');
          }
      } catch (e: any) {
          console.error("Auth init error:", e);
          // If it's a domain error, open the modal so user sees the instruction UI
          if (e.code === 'auth/unauthorized-domain') {
              setAuthModalOpen(true);
          }
      } finally {
          // Normal state listener will take over from here
          setIsLoading(false);
      }
    };

    initAuth();

    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      setIsPublicView(!user);
      if (user) setTheme(user.defaultTheme || 'dark');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isConfigValid) {
      const unsubscribe = dbService.subscribeToPosts((fetchedPosts) => {
        setPosts(fetchedPosts);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-green', 'theme-pink');
    if (theme !== 'dark') document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const showNotification = (msg: string, type: 'success' | 'info') => {
      setShowToast({ msg, type });
      setTimeout(() => setShowToast(null), 3000);
  };

  const handlePost = async (content: string, platforms: PlatformType[], images: string[], videoUrl?: string, currentUser: any) => {
    if (!currentUser) return;
    try {
const postData: any = {
        content,
        platforms,
        images,
        author: currentUser,
        isHidden: false
      };
      // Only add videoUrl if it exists and is not the string "undefined"
      if (videoUrl && videoUrl !== 'undefined') {
        postData.videoUrl = videoUrl;
      }
      await dbService.addPost(postData));
      setActiveTab('feed');
      showNotification('Published to the cloud!', 'success');
    } catch (e) {
      showNotification('Post failed. Check console for config errors.', 'info');
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    try {
      await dbService.toggleLike(postId, post.likes, !post.likedByMe);
    } catch (e) {
      showNotification('Action failed. Firebase not configured.', 'info');
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: currentUser,
      text,
      createdAt: Date.now(),
      likes: 0,
      likedByMe: false
    };
    try {
      await dbService.addComment(postId, newComment);
    } catch (e) {
      showNotification('Comment failed. Firebase error.', 'info');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {!isConfigValid && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4">
          <div className="bg-amber-500 text-slate-900 p-4 rounded-xl shadow-2xl flex items-start gap-3 border-2 border-amber-600 animate-bounce">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-sm">Firebase Configuration Missing</p>
              <p className="text-xs opacity-90">Please update firebaseConfig.ts with your credentials to enable cloud features.</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-border p-4 flex justify-between items-center">
        <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-accent pl-2">whimsyyy</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-surface-highlight rounded-lg text-muted"><Menu size={24} /></button>
      </div>

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out shadow-2xl ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar 
            activeTab={activeTab as any} 
            setActiveTab={(tab) => { setActiveTab(tab as any); setIsMenuOpen(false); }}
            currentUser={currentUser || { id: 'guest', name: 'Guest', handle: 'guest', avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=guest`, defaultTheme: 'light' }}
            availableUsers={[]} 
            onSwitchUser={() => {}}
            onDeleteUser={() => {}}
            onToggleHideUser={() => {}}
          onAddAccount={() => { setAuthModalOpen(true); }}
            isPublicView={isPublicView}
                      onTogglePublicView={() => {
            if (isPublicView) {
              if (currentUser) {
                setIsPublicView(false);
              } else {
                setAuthModalOpen(true);
              }
            } else {
              authService.logout();
            }
          }}
            onOpenSettings={() => { setSettingsModalOpen(true); setIsMenuOpen(false); }}
         />
      </div>

      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-4 pt-24 max-w-4xl mx-auto">
          {/* Removed h1 header div that displayed "Cloud Feed" or "Discovery" */}

          {activeTab === 'feed' && (
              <Feed 
                posts={posts} 
                currentUser={currentUser || { id: 'guest', name: 'Guest', handle: 'guest', avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=guest`, defaultTheme: 'light' }}
                isPublicView={isPublicView}
                onLikePost={handleLike}
                onAddComment={handleAddComment}
                onComposeClick={() => currentUser ? setActiveTab('compose') : setAuthModalOpen(true)}
                currentTheme={theme}
              />
          )}
          {activeTab === 'compose' && currentUser && (
              <Composer 
                platforms={[]} 
                user={currentUser} 
                onPost={handlePost} 
                availableUsers={[]} 
              />
          )}
        </div>
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onLogin={async () => true} />
      <SettingsModal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} currentTheme={theme} onThemeChange={setTheme} />
      {showToast && <div className="fixed bottom-8 right-8 px-6 py-3 rounded-xl bg-primary text-white z-50">{showToast.msg}</div>}
    </div>
  );
}

export default App;
