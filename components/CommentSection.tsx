
import React, { useState } from 'react';
import { Send, Trash2, User as UserIcon, Heart } from 'lucide-react';
import { Post, User } from '../types';

interface CommentSectionProps {
  post: Post;
  currentUser: User;
  onAddComment: (postId: string, text: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  isPublicView?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  post, 
  currentUser, 
  onAddComment, 
  onDeleteComment,
  onLikeComment,
  isPublicView 
}) => {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const sortedComments = post.commentsList ? [...post.commentsList].sort((a, b) => a.createdAt - b.createdAt) : [];

  return (
    <div className="mt-2 pt-3 border-t border-border/50 animate-in slide-in-from-top-2">
      {/* Comments List */}
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-surface-highlight scrollbar-track-transparent">
          {sortedComments.length === 0 ? (
              <div className="text-left py-2 text-muted text-xs">
                  No comments yet.
              </div>
          ) : (
              sortedComments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 group">
                      <img 
                          src={comment.author.avatarUrl} 
                          alt={comment.author.name} 
                          className="w-7 h-7 rounded-full border border-border object-cover shrink-0 mt-0.5" 
                      />
                      <div className="flex-1 min-w-0">
                          <div className="bg-surface-highlight/40 rounded-2xl rounded-tl-none px-3 py-2 border border-border/50 relative hover:bg-surface-highlight/60 transition-colors">
                              <div className="flex justify-between items-baseline gap-2">
                                  <span className="text-xs font-bold text-foreground truncate">{comment.author.name}</span>
                                  <span className="text-[9px] text-muted shrink-0">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{comment.text}</p>
                              
                              {onDeleteComment && (!isPublicView || comment.author.id === currentUser.id) && (
                                  <button 
                                      onClick={() => onDeleteComment(post.id, comment.id)}
                                      className="absolute top-1.5 right-2 text-muted hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete Comment"
                                  >
                                      <Trash2 size={10} />
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
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          {isPublicView ? (
              <div className="w-7 h-7 rounded-full bg-surface-highlight flex items-center justify-center border border-border shrink-0">
                  <UserIcon size={14} className="text-muted" />
              </div>
          ) : (
              <img 
                  src={currentUser.avatarUrl} 
                  alt="You" 
                  className="w-7 h-7 rounded-full border border-border object-cover" 
              />
          )}
          
          <div className="flex-1 relative">
              <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={isPublicView ? "Comment anonymously..." : `Write a comment...`}
                  className="w-full bg-surface-highlight/30 border border-border rounded-lg py-2 pl-3 pr-9 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-muted/70"
              />
              <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-1 top-1 p-1 text-primary hover:text-primary-hover disabled:opacity-50 disabled:text-muted transition-all"
              >
                  <Send size={14} />
              </button>
          </div>
      </form>
    </div>
  );
};

export default CommentSection;
