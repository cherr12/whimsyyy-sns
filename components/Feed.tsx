
import React, { useState, useRef, useEffect } from 'react';
import { Post, User, Theme } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal, AlignJustify, Volume2, VolumeX, X, Plus, Film, Eye, EyeOff, Trash2 } from 'lucide-react';
import CommentModal from './CommentModal';
import CommentSection from './CommentSection';

interface FeedProps {
  posts: Post[];
  currentUser: User;
  isPublicView?: boolean;
  onUnauthorizedAction?: () => void;
  onDeletePost?: (postId: string) => void;
  onHidePost?: (postId: string) => void;
  onLikePost: (postId: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void; // New Prop
  onAddComment: (postId: string, text: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  showHiddenToggle?: boolean;
  isShowHidden?: boolean;
  onToggleShowHidden?: () => void;
  onTagClick?: (tag: string) => void;
  activeTagFilter?: string | null;
  onClearTagFilter?: () => void;
  onComposeClick?: () => void;
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

// Helper: Extract YouTube Video ID
const getYouTubeId = (text: string) => {
  if (!text) return null;
  const match = text.match(/(?:(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/))([\w-]{11})/);
  return match ? match[1] : null;
};

// Helper: Render Rich Text (URLs, Hashtags, Mentions)
const renderRichContent = (text: string, onTagClick?: (tag: string) => void) => {
  // 1. Split by URLs first
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  
  return parts.map((part, i) => {
    // If it's a URL
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary-light hover:underline break-all z-10 relative"
        >
          {part}
        </a>
      );
    }
    
    // If it's regular text, look for hashtags and mentions
    const subParts = part.split(/([#@][\w\uAC00-\uD7AF]+)/g);

    return (
        <React.Fragment key={i}>
            {subParts.map((subPart, j) => {
                if (subPart.startsWith('#')) {
                    return (
                        <span 
                            key={j} 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onTagClick) onTagClick(subPart);
                            }}
                            className="text-accent hover:text-primary-light hover:underline cursor-pointer font-medium z-10 relative"
                        >
                            {subPart}
                        </span>
                    );
                }
                if (subPart.startsWith('@')) {
                    return (
                        <span key={j} className="text-primary hover:text-primary-hover font-semibold cursor-pointer hover:underline z-10 relative">
                            {subPart}
                        </span>
                    );
                }
                return subPart;
            })}
        </React.Fragment>
    );
  });
};

interface ReelsItemProps {
    post: Post;
    isPublicView: boolean;
    onLike: () => void;
    onCommentClick: () => void;
    onTagClick?: (tag: string) => void;
}

const ReelsItem: React.FC<ReelsItemProps> = ({ post, isPublicView, onLike, onCommentClick, onTagClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const images = post.images && post.images.length > 0 ? post.images : (post.imageUrl ? [post.imageUrl] : []);
    const hasVideo = !!post.videoUrl;
    const youtubeId = getYouTubeId(post.content);
    
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <div className="relative w-full h-full snap-start shrink-0 bg-black flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
                {hasVideo ? (
                    <div className="relative w-full h-full group">
                        <video 
                            ref={videoRef}
                            src={post.videoUrl} 
                            className="w-full h-full object-cover opacity-80"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                        <button 
                            onClick={toggleMute}
                            className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                    </div>
                ) : youtubeId ? (
                    <div className="relative w-full h-full">
                        <iframe
                            className="w-full h-full object-cover opacity-80 pointer-events-auto"
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1&rel=0&origin=${window.location.origin}`}
                            title="YouTube Shorts"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : (
                    <img src={images[0]} alt="Reel content" className="w-full h-full object-cover opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none"></div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 pb-12 flex items-end justify-between">
                <div className="flex-1 mr-12 text-left pointer-events-none"> 
                    <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                        <img src={post.author.avatarUrl} alt={post.author.name} className="w-10 h-10 rounded-full border-2 border-white/20" />
                        <div>
                            <p className="font-bold text-white text-sm hover:underline cursor-pointer drop-shadow-md">{post.author.name}</p>
                            <p className="text-xs text-slate-300 drop-shadow-md">@{post.author.handle}</p>
                        </div>
                    </div>
                    <div className="text-white text-sm line-clamp-3 mb-3 drop-shadow-md whitespace-pre-wrap pointer-events-auto">
                        {renderRichContent(post.content, onTagClick)}
                    </div>
                    <div className="flex flex-wrap gap-2 pointer-events-auto">
                        {post.platforms.map(p => (
                            <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/10">
                                {p}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 items-center pointer-events-auto">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onLike(); }} 
                        className="flex flex-col items-center gap-1 group"
                     >
                        <div className={`p-3 rounded-full bg-slate-800/60 backdrop-blur-md text-white transition-all ${post.likedByMe ? 'text-red-500' : ''}`}>
                            <Heart size={24} fill={post.likedByMe ? "currentColor" : "none"} className={post.likedByMe ? "text-red-500" : ""} />
                        </div>
                        <span className="text-xs font-bold text-white drop-shadow-md">{post.likes}</span>
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onCommentClick(); }} 
                        className="flex flex-col items-center gap-1 group"
                     >
                        <div className="p-3 rounded-full bg-slate-800/60 backdrop-blur-md text-white transition-all group-hover:bg-primary group-hover:text-white">
                            <MessageCircle size={24} />
                        </div>
                        <span className="text-xs font-bold text-white drop-shadow-md">{post.comments}</span>
                     </button>
                     
                     {!isPublicView && (
                         <button className="flex flex-col items-center gap-1 group">
                            <div className="p-3 rounded-full bg-slate-800/60 backdrop-blur-md text-white transition-all group-hover:bg-green-500 group-hover:text-white">
                               <Share2 size={24} />
                            </div>
                         </button>
                     )}
                </div>
            </div>
        </div>
    );
};

const Feed: React.FC<FeedProps> = ({ 
    posts, 
    currentUser,
    isPublicView = false, 
    onUnauthorizedAction, 
    onDeletePost, 
    onHidePost,
    onLikePost,
    onLikeComment,
    onAddComment,
    onDeleteComment,
    showHiddenToggle,
    isShowHidden,
    onToggleShowHidden,
    onTagClick,
    activeTagFilter,
    onClearTagFilter,
    onComposeClick,
    currentTheme,
    onThemeChange
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'reels'>('list');
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveMenuPostId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const toggleComments = (postId: string) => {
    setExpandedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };
  
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted relative min-h-[50vh]">
        <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mb-4">
            {activeTagFilter ? <AlignJustify size={32} /> : (isShowHidden ? <EyeOff size={32} /> : <MessageCircle size={32} />)}
        </div>
        <p className="text-lg font-medium text-foreground">
            {activeTagFilter 
                ? `No posts found with ${activeTagFilter}` 
                : (isShowHidden ? "No hidden posts" : "No posts yet")}
        </p>
        <p className="text-sm">
            {activeTagFilter
                ? "Try searching for a different tag or clear the filter."
                : (isPublicView ? "Check back later for updates." : (isShowHidden ? "Hidden posts will appear here." : "Create your first post to get started!"))}
        </p>
        
        <div className="flex gap-4 mt-4">
            {activeTagFilter && onClearTagFilter && (
                <button 
                    onClick={onClearTagFilter}
                    className="text-primary-light hover:text-primary hover:underline text-sm font-medium flex items-center gap-2"
                >
                    <X size={14} /> Clear Filter
                </button>
            )}
            {isShowHidden && showHiddenToggle && (
                <button 
                    onClick={onToggleShowHidden}
                    className="text-primary-light hover:text-primary hover:underline text-sm font-medium"
                >
                    View visible posts
                </button>
            )}
        </div>

        {!isPublicView && onComposeClick && (
            <button 
                onClick={onComposeClick}
                className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover text-white p-4 rounded-full shadow-lg shadow-primary/30 transition-transform hover:scale-110 active:scale-95 z-40 flex items-center justify-center border border-primary/50"
                title="New Post"
            >
                <Plus size={28} />
            </button>
        )}
      </div>
    );
  }

  const renderImages = (post: Post) => {
    const images = post.images && post.images.length > 0 ? post.images : (post.imageUrl ? [post.imageUrl] : []);
    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div className="mb-2 sm:mb-4 rounded-xl overflow-hidden border border-border">
          <img src={images[0]} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
        </div>
      );
    }

    const getGridClass = () => {
        if (images.length === 2) return 'grid-cols-2';
        if (images.length === 3) return 'grid-cols-2';
        return 'grid-cols-2'; 
    };

    return (
      <div className={`mb-2 sm:mb-4 grid gap-1 rounded-xl overflow-hidden border border-border ${getGridClass()}`}>
         {images.map((img, idx) => (
             <div 
                key={idx} 
                className={`relative aspect-square ${images.length === 3 && idx === 0 ? 'col-span-2' : ''}`}
             >
                 <img src={img} alt={`Slide ${idx}`} className="absolute inset-0 w-full h-full object-cover" />
             </div>
         ))}
      </div>
    );
  };

  const renderVideo = (post: Post) => {
      if (!post.videoUrl) return null;
      return (
          <div className="mb-2 sm:mb-4 rounded-xl overflow-hidden border border-border max-w-sm mx-auto bg-black relative group">
              <div className="aspect-[9/16] w-full relative">
                  <video 
                    src={post.videoUrl} 
                    className="absolute inset-0 w-full h-full object-cover"
                    controls
                    playsInline
                    loop
                  />
              </div>
          </div>
      );
  }

  const handleMenuClick = (e: React.MouseEvent, postId: string) => {
      e.stopPropagation();
      setActiveMenuPostId(activeMenuPostId === postId ? null : postId);
  };

  const mediaPosts = posts.filter(p => 
      p.videoUrl || 
      (p.images && p.images.length > 0) || 
      p.imageUrl ||
      getYouTubeId(p.content)
  );

  const activeCommentPost = posts.find(p => p.id === activeCommentPostId);

  return (
    <div className="max-w-3xl mx-auto pb-20 relative">
      
      <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted">
                    {viewMode === 'list' ? (isShowHidden ? 'Hidden Posts' : 'Latest Updates') : 'Short-form & Media'}
                </div>
                
                {showHiddenToggle && (
                    <button 
                        onClick={onToggleShowHidden}
                        className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                            isShowHidden 
                            ? 'bg-primary/20 text-primary-light border-primary/30' 
                            : 'text-muted border-border hover:text-foreground'
                        }`}
                    >
                        {isShowHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{isShowHidden ? 'Viewing Hidden' : 'View Hidden'}</span>
                    </button>
                )}
              </div>

              {activeTagFilter && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                      <span className="text-xs text-muted">Filtering by:</span>
                      <div className="flex items-center gap-1 bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full text-xs font-medium">
                          <span>{activeTagFilter}</span>
                          {onClearTagFilter && (
                              <button onClick={onClearTagFilter} className="hover:text-white transition-colors">
                                  <X size={12} />
                              </button>
                          )}
                      </div>
                  </div>
              )}
          </div>

          <div className="flex items-center gap-3">
              {/* Theme Selector Circles */}
              {onThemeChange && (
                  <div className="flex items-center gap-2 p-1 bg-surface-highlight/50 rounded-full border border-border/50 backdrop-blur-md">
                      {[
                          { id: 'dark', color: 'bg-slate-950', border: 'border-slate-700' },
                          { id: 'light', color: 'bg-white', border: 'border-slate-300' },
                          { id: 'green', color: 'bg-green-500', border: 'border-green-700' },
                          { id: 'pink', color: 'bg-pink-300', border: 'border-pink-400' },
                      ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => onThemeChange(t.id as Theme)}
                            className={`w-4 h-4 rounded-full border ${t.color} ${t.border} transition-all duration-300 ${
                                currentTheme === t.id 
                                ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-sm' 
                                : 'hover:scale-110 opacity-70 hover:opacity-100'
                            }`}
                            aria-label={`Switch to ${t.id} theme`}
                            title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                          />
                      ))}
                  </div>
              )}

              {/* View Mode Switcher */}
              <div className="flex bg-surface rounded-lg p-1 border border-border">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-surface-highlight text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                    title="List View"
                  >
                      <AlignJustify size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('reels')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'reels' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
                    title="Reels View"
                  >
                      <Film size={18} />
                  </button>
              </div>
          </div>
      </div>

      {viewMode === 'reels' ? (
          mediaPosts.length > 0 ? (
            <div className="h-[calc(100vh-180px)] w-full max-w-sm mx-auto overflow-y-scroll snap-y snap-mandatory rounded-2xl border border-border bg-black scroll-smooth shadow-2xl no-scrollbar">
                {mediaPosts.map(post => (
                    <ReelsItem 
                        key={post.id} 
                        post={post} 
                        isPublicView={isPublicView} 
                        onLike={() => onLikePost(post.id)}
                        onCommentClick={() => setActiveCommentPostId(post.id)}
                        onTagClick={onTagClick}
                    />
                ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface/50 rounded-2xl border border-border border-dashed">
                <Film size={48} className="mx-auto text-muted mb-4" />
                <h3 className="text-lg font-medium text-foreground">No media content</h3>
                <p className="text-muted text-sm mt-1">
                    {activeTagFilter ? "No media posts match the tag." : "Create posts with images, video, or YouTube links to see them here."}
                </p>
            </div>
          )
      ) : (
          <div className="space-y-6">
            {posts.map((post) => {
                const youtubeId = getYouTubeId(post.content);
                return (
                    <article key={post.id} className={`bg-surface border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${post.isHidden ? 'opacity-70 border-dashed border-muted' : ''} shadow-sm`}>
                    <div className="p-3 sm:p-4 flex gap-3 sm:gap-4">
                        <img src={post.author.avatarUrl} alt={post.author.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div>
                                <span className="font-bold text-foreground hover:underline cursor-pointer text-sm sm:text-base">{post.author.name}</span>
                                <span className="text-muted ml-2 text-xs sm:text-sm">@{post.author.handle}</span>
                                <span className="text-muted mx-2">·</span>
                                <span className="text-muted text-xs sm:text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                                {post.isHidden && <span className="ml-2 text-[10px] uppercase font-bold bg-surface-highlight text-muted px-1.5 py-0.5 rounded border border-border">Hidden</span>}
                            </div>
                            
                            <div className="relative">
                                <button 
                                    onClick={(e) => handleMenuClick(e, post.id)}
                                    className="text-muted hover:text-foreground p-1 rounded-full hover:bg-surface-highlight transition-colors"
                                >
                                    <MoreHorizontal size={18} />
                                </button>

                                {activeMenuPostId === post.id && !isPublicView && (
                                    <div className="absolute right-0 top-8 w-36 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-20 animate-in zoom-in-95 duration-200">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(onHidePost) onHidePost(post.id);
                                                setActiveMenuPostId(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted hover:bg-surface-highlight hover:text-foreground text-left"
                                        >
                                            {post.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                            <span>{post.isHidden ? "Unhide Post" : "Hide Post"}</span>
                                        </button>
                                        <div className="h-px bg-border/50 my-1"></div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(onDeletePost) onDeletePost(post.id);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 text-left"
                                        >
                                            <Trash2 size={14} />
                                            <span>Delete Post</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-foreground whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed mb-1 sm:mb-3">
                            {renderRichContent(post.content, onTagClick)}
                        </div>

                        {youtubeId && (
                            <div className="mb-2 sm:mb-4 rounded-xl overflow-hidden border border-border bg-black aspect-video w-full relative">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1&origin=${window.location.origin}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                    loading="lazy"
                                    className="absolute inset-0"
                                ></iframe>
                            </div>
                        )}

                        {renderImages(post)}
                        {renderVideo(post)}

                        <div className="flex gap-2 mb-2 sm:mb-4">
                            {post.platforms.map(p => (
                            <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-highlight text-muted border border-border">
                                {p}
                            </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 text-muted">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onLikePost(post.id); }} 
                                className={`flex items-center gap-2 group hover:text-red-500 ${post.likedByMe ? 'text-red-500' : ''}`}
                            >
                                <div className={`p-2 rounded-full group-hover:bg-red-500/10`}>
                                    <Heart size={18} fill={post.likedByMe ? "currentColor" : "none"} />
                                </div>
                                <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleComments(post.id); }} 
                                className={`flex items-center gap-2 transition-colors group ${expandedPostIds.has(post.id) ? 'text-primary' : 'hover:text-primary'}`}
                            >
                                <div className={`p-2 rounded-full ${expandedPostIds.has(post.id) ? 'bg-primary/10' : 'group-hover:bg-primary/10'}`}>
                                    <MessageCircle size={18} fill={expandedPostIds.has(post.id) ? "currentColor" : "none"} />
                                </div>
                                <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            
                            {!isPublicView && (
                                <button className="flex items-center gap-2 transition-colors group hover:text-green-500 ml-auto">
                                    <div className="p-2 rounded-full group-hover:bg-green-500/10">
                                        <Share2 size={18} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Inline Comment Section */}
                        {expandedPostIds.has(post.id) && (
                            <CommentSection 
                                post={post}
                                currentUser={currentUser}
                                onAddComment={onAddComment}
                                onDeleteComment={onDeleteComment}
                                onLikeComment={onLikeComment} // Pass handler
                                isPublicView={isPublicView}
                            />
                        )}

                        </div>
                    </div>
                    </article>
                );
            })}
          </div>
      )}

      {!isPublicView && onComposeClick && (
          <button 
              onClick={onComposeClick}
              className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover text-white p-4 rounded-full shadow-lg shadow-primary/30 transition-all hover:scale-110 active:scale-95 z-40 flex items-center justify-center border border-primary/50"
              title="New Post"
          >
              <Plus size={28} />
          </button>
      )}

      {/* Keep Modal for Reels View */}
      {activeCommentPost && viewMode === 'reels' && (
        <CommentModal 
            isOpen={!!activeCommentPostId}
            onClose={() => setActiveCommentPostId(null)}
            post={activeCommentPost}
            currentUser={currentUser}
            onAddComment={(text) => onAddComment(activeCommentPost.id, text)}
            onDeleteComment={onDeleteComment}
            onLikeComment={onLikeComment} // Pass handler
            isPublicView={isPublicView}
        />
      )}
    </div>
  );
};

export default Feed;
