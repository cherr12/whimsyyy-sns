
export enum PlatformType {
  OMNIPOST = 'OmniPost',
  X = 'X',
  THREADS = 'Threads',
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok',
  YOUTUBE = 'YouTube'
}

export interface PlatformConfig {
  id: PlatformType;
  name: string;
  icon: string; // Lucide icon name usually, but handled in component mapping
  color: string;
  isConnected: boolean;
  maxChars?: number;
  connectedHandle?: string;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  isHidden?: boolean;
  defaultTheme?: Theme; // Added: Per-user theme preference
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  createdAt: number;
  likes: number;     // Added
  likedByMe?: boolean; // Added
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string; // Kept for backward compatibility
  images?: string[]; // New: Multiple images
  videoUrl?: string; // New: Video support
  platforms: PlatformType[];
  createdAt: number;
  author: User;
  likes: number;
  comments: number;
  // In a real app, we'd store external IDs here
  externalStatuses?: Record<PlatformType, 'published' | 'failed' | 'pending'>;
  isHidden?: boolean;
  likedByMe?: boolean;
  commentsList?: Comment[];
}

export interface AIResponse {
  optimizedText: string;
  hashtags: string[];
}

export type Theme = 'dark' | 'light' | 'lego' | 'pink';
