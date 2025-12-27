import React from 'react';
import { User, Post } from '../types';
import { Plus, LayoutGrid } from 'lucide-react';

interface StoriesBarProps {
  users: User[];
  posts: Post[];
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  onAddAccount: () => void;
  isReadOnly?: boolean;
}

const StoriesBar: React.FC<StoriesBarProps> = ({ 
  users, 
  posts, 
  selectedUserId, 
  onSelectUser,
  onAddAccount,
  isReadOnly = false
}) => {
  // Determine the status of the user's "story" ring
  const getUserStatus = (userId: string) => {
    const userPosts = posts.filter(p => p.author.id === userId);
    if (userPosts.length === 0) return 'empty';
    
    // Check if there is a "new" post (e.g. created in the last 5 minutes)
    const hasRecent = userPosts.some(p => Date.now() - p.createdAt < 5 * 60 * 1000);
    return hasRecent ? 'new' : 'has-posts';
  };

  return (
    <div className="mb-1 animate-in slide-in-from-top-4 duration-500 mt-0 sm:mt-2">
       {/* Responsive padding: pt-4 on mobile (<640px), pt-14 on tablet/desktop (sm+) to restore original spacing */}
       <div className="flex gap-4 overflow-x-auto pt-4 sm:pt-14 pb-2 px-4 no-scrollbar items-start">
          
          {/* View All Button */}
          <button 
             onClick={() => onSelectUser(null)}
             className="flex flex-col items-center gap-2 min-w-[72px] group"
          >
             <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                 selectedUserId === null 
                 ? 'bg-primary shadow-lg shadow-primary/30 text-white' 
                 : 'bg-surface text-muted hover:bg-surface-highlight hover:text-foreground'
             }`}>
                <LayoutGrid size={20} className="transition-colors" />
             </div>
             <span className={`text-xs font-medium transition-colors ${selectedUserId === null ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}>View All</span>
          </button>

          {/* User List */}
          {users.map(user => {
             const status = getUserStatus(user.id);
             const isSelected = selectedUserId === user.id;
             
             return (
               <button 
                 key={user.id}
                 onClick={() => onSelectUser(isSelected ? null : user.id)}
                 className="flex flex-col items-center gap-2 min-w-[72px] group relative"
               >
                 <div className={`relative transition-all duration-300 ${
                     isSelected ? 'scale-110' : 'hover:scale-105'
                 }`}>
                    {/* Simplified Avatar - Clean ring only when selected */}
                    <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className={`w-14 h-14 rounded-full object-cover transition-all ${
                            isSelected 
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                            : 'opacity-70 hover:opacity-100'
                        }`}
                    />

                    {/* Simple "New" Indicator Dot */}
                    {status === 'new' && !isSelected && (
                         <span className="absolute top-0 right-0 w-3 h-3 bg-accent border-2 border-background rounded-full shadow-sm"></span>
                    )}
                 </div>
                 
                 <span className={`text-xs font-medium max-w-[80px] truncate transition-colors ${isSelected ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}>
                    {user.name.split(' ')[0]}
                 </span>
               </button>
             );
          })}

          {/* Add Account Button - Hidden in Read Only Mode */}
          {!isReadOnly && (
            <button 
                onClick={onAddAccount}
                className="flex flex-col items-center gap-2 min-w-[72px] group"
            >
                <div className="w-14 h-14 rounded-full border border-dashed border-muted flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all">
                    <Plus size={20} className="text-muted group-hover:text-primary" />
                </div>
                <span className="text-xs font-medium text-muted group-hover:text-primary">Add New</span>
            </button>
          )}
       </div>
    </div>
  );
}

export default StoriesBar;