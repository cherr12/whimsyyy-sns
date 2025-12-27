
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, User as UserIcon, Heart } from 'lucide-react';
import { Post, User, Comment } from '../types';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  currentUser: User;
  onAddComment: (text: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  isPublicView?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
    isOpen, 
    onClose, 
    post, 
    currentUser, 
    onAddComment, 
    onDeleteComment, 
    onLikeComment,
    isPublicView 
}) => {
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (isOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [post.commentsList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText);
    setCommentText('');
  };

  const sortedComments = post.commentsList ? [...post.commentsList].sort((a, b) => a.createdAt - b.createdAt) : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface/95 backdrop-blur z-10">
            <h2 className="text-lg font-bold text-foreground">Comments</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-highlight rounded-full text-muted hover:text-foreground transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sortedComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted">
                    <p className="text-sm">No comments yet.</p>
                    <p className="text-xs mt-1">Be the first to share your thoughts!</p>
                </div>
            ) : (
                sortedComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                        <img 
                            src={comment.author.avatarUrl} 
                            alt={comment.author.name} 
                            className="w-8 h-8 rounded-full border border-border object-cover shrink-0 mt-1" 
                        />
                        <div className="flex-1 space-y-1">
                            <div className="bg-surface-highlight/50 rounded-2xl rounded-tl-none p-3 border border-border/50 relative">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-foreground">{comment.author.name}</span>
                                    <span className="text-[10px] text-muted">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                                
                                {/* Delete Button */}
                                {onDeleteComment && (!isPublicView || comment.author.id === currentUser.id) && (
                                    <button 
                                        onClick={() => onDeleteComment(post.id, comment.id)}
                                        className="absolute top-2 right-2 text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Comment"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                                
                                {/* Like Button */}
                                {onLikeComment && (
                                    <div className="flex justify-end mt-1">
                                        <button
                                            onClick={() => onLikeComment(post.id, comment.id)}
                                            className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${comment.likedByMe ? 'text-red-500' : 'text-muted hover:text-red-500'}`}
                                        >
                                            <Heart size={10} fill={comment.likedByMe ? "currentColor" : "none"} />
                                            <span>{comment.likes > 0 ? comment.likes : ''}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
            <div ref={commentsEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-surface">
            <form onSubmit={handleSubmit} className="flex gap-2">
                {isPublicView ? (
                    <div className="w-8 h-8 rounded-full bg-surface-highlight flex items-center justify-center border border-border shrink-0 hidden sm:flex">
                        <UserIcon size={16} className="text-muted" />
                    </div>
                ) : (
                    <img 
                        src={currentUser.avatarUrl} 
                        alt="You" 
                        className="w-8 h-8 rounded-full border border-border object-cover hidden sm:block" 
                    />
                )}
                
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={isPublicView ? "Comment anonymously..." : `Comment as ${currentUser.name}...`}
                        className="w-full bg-surface-highlight border border-border rounded-full py-2.5 pl-4 pr-12 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        disabled={!commentText.trim()}
                        className="absolute right-1 top-1 p-1.5 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:bg-transparent disabled:text-muted transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
