import React, { useState, useEffect, useRef } from 'react';
import { PlatformType, PlatformConfig, User } from '../types';
import PlatformToggle from './PlatformToggle';
import { optimizeContentForPlatform, generatePostIdeas, generateImagesFromPrompt, generateImagesWithReferences, generateVideo } from '../services/geminiService';
import { Image as ImageIcon, Sparkles, Send, X, RefreshCw, Lightbulb, Wand2, Check, Plus, CheckSquare, AlertCircle, Loader2, Type as TypeIcon, Layers, UserCircle, Film, Key, ChevronDown } from 'lucide-react';

interface ComposerProps {
  platforms: PlatformConfig[];
  user: User;
  onPost: (content: string, selectedPlatforms: PlatformType[], images: string[], videoUrl?: string, author?: User) => void;
  availableUsers: User[];
}

const Composer: React.FC<ComposerProps> = ({ platforms, user, onPost, availableUsers }) => {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([PlatformType.OMNIPOST]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizedVersions, setOptimizedVersions] = useState<Record<string, {text: string, hashtags: string[]}>>({});
  
  // Author Selection State
  const [selectedAuthor, setSelectedAuthor] = useState<User>(user);
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const authorDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync prop user to state if it changes externally
  useEffect(() => {
    setSelectedAuthor(user);
  }, [user]);

  // Close author dropdown when clicking outside
  useEffect(() => {
      const handleClick = (e: MouseEvent) => {
          if (authorDropdownRef.current && !authorDropdownRef.current.contains(e.target as Node)) {
              setIsAuthorDropdownOpen(false);
          }
      }
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
  }, []);

  // Ideas State
  const [showIdeas, setShowIdeas] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [isIdeasLoading, setIsIdeasLoading] = useState(false);

  // AI Studio State
  const [showImageGen, setShowImageGen] = useState(false);
  const [genMode, setGenMode] = useState<'text' | 'remix' | 'video'>('text');
  
  // Image Gen State
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [generatedCandidates, setGeneratedCandidates] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [addedCandidateIndices, setAddedCandidateIndices] = useState<Set<number>>(new Set());
  
  // Remix State
  const [refImages, setRefImages] = useState<File[]>([]);
  const [useAvatar, setUseAvatar] = useState(false);
  const [avatarBlob, setAvatarBlob] = useState<string | null>(null);

  // Video Gen State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true); // Assuming true initially, checked on interaction

  const generationSessionId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update previews whenever images change
  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [images]);

  // Handle avatar blob creation when useAvatar changes or user changes
  useEffect(() => {
      if (useAvatar && selectedAuthor.avatarUrl) {
          const fetchAvatar = async () => {
              try {
                  const response = await fetch(selectedAuthor.avatarUrl);
                  const blob = await response.blob();
                  const reader = new FileReader();
                  reader.onloadend = () => {
                      setAvatarBlob(reader.result as string);
                  };
                  reader.readAsDataURL(blob);
              } catch (e) {
                  console.error("Failed to fetch avatar for remix", e);
                  setGenerationError("Could not load profile picture (CORS restriction). Try uploading it manually.");
                  setUseAvatar(false);
              }
          };
          fetchAvatar();
      } else {
          setAvatarBlob(null);
      }
  }, [useAvatar, selectedAuthor.avatarUrl]);

  // Check API Key for Video when switching to Video tab
  useEffect(() => {
      if (genMode === 'video') {
          checkApiKey();
      }
  }, [genMode]);

  const checkApiKey = async () => {
      if ((window as any).aistudio) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
      }
  };

  const handleSelectApiKey = async () => {
      if ((window as any).aistudio) {
          await (window as any).aistudio.openSelectKey();
          // Re-check after selection flow
          checkApiKey();
      }
  };

  const handlePlatformToggle = (id: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeGeneratedVideo = () => {
      setGeneratedVideo(null);
  }

  // Helper for Reference Images in Remix Mode
  const handleRefImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setRefImages(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };
  
  const removeRefImage = (index: number) => {
      setRefImages(prev => prev.filter((_, i) => i !== index));
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  // Convert Blob URL to Base64 (for video persistence)
  const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    let bstr = atob(arr.length > 1 ? arr[1] : arr[0]); 
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: 'image/png'});
  }

  const handleGenerate = async () => {
      if (genMode === 'video') {
          handleGenerateVideo();
      } else {
          handleGenerateImage();
      }
  }

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    
    // Double check API key before starting
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
    if (!hasKey) {
        setHasApiKey(false);
        return;
    }

    setIsVideoGenerating(true);
    setGenerationError(null);
    setGeneratedVideo(null);

    try {
        const videoUrl = await generateVideo(videoPrompt);
        setGeneratedVideo(videoUrl);
    } catch (error: any) {
        console.error("Video Gen Error:", error);
        setGenerationError(error.message || "Failed to create video.");
    } finally {
        setIsVideoGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    const currentSessionId = ++generationSessionId.current;

    setIsImageGenerating(true);
    setGeneratedCandidates([]);
    setGenerationError(null);
    setAddedCandidateIndices(new Set());
    
    try {
        const onGen = (newImageBase64: string) => {
            if (currentSessionId === generationSessionId.current) {
                setGeneratedCandidates(prev => [...prev, newImageBase64]);
            }
        };

        if (genMode === 'remix') {
             // Gather all reference images
             const refPromises = refImages.map(fileToBase64);
             const base64Refs = await Promise.all(refPromises);
             
             if (useAvatar && avatarBlob) {
                 base64Refs.unshift(avatarBlob);
             }

             if (base64Refs.length === 0) {
                 throw new Error("Please select at least one reference image or your avatar for Remix mode.");
             }

             await generateImagesWithReferences(imagePrompt, base64Refs, 2, onGen);

        } else {
             // Standard Text-to-Image
             await generateImagesFromPrompt(imagePrompt, 2, onGen);
        }

    } catch (error: any) {
        console.error("Generation error in UI:", error);
        if (currentSessionId === generationSessionId.current) {
            let msg = error.message || "Failed to generate images.";
            if (msg.includes("Quota") || msg.includes("429")) {
                msg = "Usage limit exceeded. Generating fewer images next time.";
            }
            setGenerationError(msg);
        }
    } finally {
        if (currentSessionId === generationSessionId.current) {
            setIsImageGenerating(false);
        }
    }
  };

  const toggleGeneratedImageSelection = (base64: string, index: number) => {
    if (addedCandidateIndices.has(index)) {
      return; 
    }

    const file = dataURLtoFile(`data:image/png;base64,${base64}`, `ai-gen-${Date.now()}-${index}.png`);
    setImages(prev => [...prev, file]);
    setAddedCandidateIndices(prev => new Set(prev).add(index));
  };

  const handleSelectAllGenerated = () => {
    generatedCandidates.forEach((base64, idx) => {
        if (!addedCandidateIndices.has(idx)) {
            toggleGeneratedImageSelection(base64, idx);
        }
    });
  };

  const handleSmartOptimize = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    
    const platformsToOptimize = selectedPlatforms.filter(p => p !== PlatformType.OMNIPOST);
    const newVersions: Record<string, {text: string, hashtags: string[]}> = {};

    for (const platform of platformsToOptimize) {
       const result = await optimizeContentForPlatform(content, platform);
       newVersions[platform] = result;
    }

    setOptimizedVersions(newVersions);
    setIsGenerating(false);
  };

  const applyOptimizedContent = (platformId: string) => {
      if (optimizedVersions[platformId]) {
          const { text, hashtags } = optimizedVersions[platformId];
          const fullText = `${text}\n\n${hashtags.join(' ')}`;
          setContent(fullText);
          const nextVersions = {...optimizedVersions};
          delete nextVersions[platformId];
          setOptimizedVersions(nextVersions);
      }
  };

  const handleGenerateIdeas = async () => {
      setIsIdeasLoading(true);
      setShowIdeas(true);
      const generated = await generatePostIdeas(content.substring(0, 50) || "Life of a content creator");
      setIdeas(generated);
      setIsIdeasLoading(false);
  };

  const resetComposer = () => {
    setContent('');
    setImages([]);
    setImagePreviews([]);
    setGeneratedVideo(null);
    setOptimizedVersions({});
    setGeneratedCandidates([]);
    setGenerationError(null);
    setAddedCandidateIndices(new Set());
    setRefImages([]);
    setUseAvatar(false);
  };

  const handlePostSubmit = async () => {
    setIsGenerating(true);
    try {
        // Convert images to base64 for persistence
        const base64Images = await Promise.all(images.map(fileToBase64));
        
        let finalVideoUrl = ''361
        ;
        if (generatedVideo) {
            // Try to persist video as base64 too
            try {
                finalVideoUrl = await blobUrlToBase64(generatedVideo);
            } catch (e) {
                console.warn("Could not persist video, falling back to blob URL (may be lost on refresh)", e);
                finalVideoUrl = generatedVideo;
            }
        }

      onPost(content, selectedPlatforms, base64Images, finalVideoUrl || '', selectedUser);        resetComposer();
    } catch (e) {
        console.error("Failed to process post attachments", e);
    } finally {
        setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header / Platform Selector */}
        <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-sm relative z-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">New Post as</h2>
                {/* Author Selection Dropdown */}
                <div className="relative" ref={authorDropdownRef}>
                    <button 
                        onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-highlight transition-colors border border-transparent hover:border-border"
                    >
                        <img src={selectedAuthor.avatarUrl} alt={selectedAuthor.name} className="w-6 h-6 rounded-full border border-border" />
                        <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{selectedAuthor.name}</span>
                        <ChevronDown size={14} className="text-muted" />
                    </button>

                    {isAuthorDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in zoom-in-95">
                            <div className="px-3 py-2 text-[10px] font-bold text-muted uppercase tracking-wider bg-surface-highlight/50">
                                Select Author
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {availableUsers.filter(u => !u.isHidden || u.id === selectedAuthor.id).map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedAuthor(user);
                                            setIsAuthorDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                            selectedAuthor.id === user.id ? 'bg-primary/10 text-primary-light' : 'text-muted hover:bg-surface-highlight hover:text-foreground'
                                        }`}
                                    >
                                        <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-border" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{user.name}</div>
                                            <div className="text-xs text-muted truncate">@{user.handle}</div>
                                        </div>
                                        {selectedAuthor.id === user.id && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex gap-2">
                 <button 
                    onClick={handleGenerateIdeas}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 rounded-full hover:bg-amber-500/20 transition-colors"
                >
                    <Lightbulb size={14} />
                    <span>Ideas</span>
                </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {platforms.map(p => (
              <PlatformToggle 
                key={p.id} 
                platform={p} 
                isSelected={selectedPlatforms.includes(p.id)} 
                onToggle={handlePlatformToggle} 
              />
            ))}
          </div>
        </div>

        {/* Ideas Panel */}
        {showIdeas && (
            <div className="bg-surface p-4 border-b border-border animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">AI Suggestions</span>
                    <button onClick={() => setShowIdeas(false)}><X size={14} className="text-muted" /></button>
                </div>
                {isIdeasLoading ? (
                    <div className="text-sm text-muted italic">Brainstorming...</div>
                ) : (
                    <div className="space-y-2">
                        {ideas.map((idea, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => { setContent(idea); setShowIdeas(false); }}
                                className="p-2 rounded bg-surface-highlight/50 hover:bg-surface-highlight cursor-pointer text-sm text-foreground transition-colors"
                            >
                                {idea}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Editor Area */}
        <div 
            className="p-6 relative min-h-[160px] cursor-text bg-background/30"
            onClick={() => textareaRef.current?.focus()}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${selectedAuthor?.name?.split(' ')[0] || 'there'}?`}
            className="w-full h-40 bg-transparent border-none focus:ring-0 text-lg placeholder-muted/70 text-foreground resize-none p-0 mb-4 focus:outline-none appearance-none"
            spellCheck={false}
            autoFocus
          />

          {/* Attachments Preview */}
          <div className="flex flex-wrap gap-3 mb-4">
              {/* Images */}
              {imagePreviews.map((url, idx) => (
                <div key={`img-${idx}`} className="relative group w-24 h-24 animate-in fade-in duration-200">
                  <img 
                    src={url} 
                    alt={`Attachment ${idx}`} 
                    className="w-full h-full object-cover rounded-lg border border-border"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    className="absolute -top-2 -right-2 p-1 bg-surface rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity border border-border hover:bg-red-500 hover:text-white hover:border-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {/* Generated Video Attachment */}
              {generatedVideo && (
                  <div className="relative group w-24 h-40 animate-in fade-in duration-200">
                      <video 
                          src={generatedVideo} 
                          className="w-full h-full object-cover rounded-lg border border-border"
                          muted
                          loop
                          playsInline
                          onMouseOver={e => e.currentTarget.play()}
                          onMouseOut={e => e.currentTarget.pause()}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeGeneratedVideo(); }}
                        className="absolute -top-2 -right-2 p-1 bg-surface rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity border border-border hover:bg-red-500 hover:text-white hover:border-red-500"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 py-0.5">
                        <Film size={10} className="text-white" />
                      </div>
                  </div>
              )}
          </div>

          {/* AI Studio Panel */}
          {showImageGen && (
            <div className="mt-2 p-4 bg-surface-highlight/50 rounded-xl border border-border animate-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-primary-light">
                        <Wand2 size={16} />
                        <span className="text-sm font-bold uppercase tracking-wider">AI Studio</span>
                    </div>
                    <button onClick={() => setShowImageGen(false)}><X size={14} className="text-muted hover:text-foreground" /></button>
                </div>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-4 bg-surface p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setGenMode('text')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            genMode === 'text' 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'text-muted hover:text-foreground'
                        }`}
                    >
                        <TypeIcon size={14} />
                        Text to Image
                    </button>
                    <button
                        onClick={() => setGenMode('remix')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            genMode === 'remix' 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'text-muted hover:text-foreground'
                        }`}
                    >
                        <Layers size={14} />
                        Remix Image
                    </button>
                    <button
                        onClick={() => setGenMode('video')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            genMode === 'video' 
                            ? 'bg-accent text-white shadow-sm' 
                            : 'text-muted hover:text-foreground'
                        }`}
                    >
                        <Film size={14} />
                        Text to Video
                    </button>
                </div>

                {/* API Key Check for Video */}
                {genMode === 'video' && !hasApiKey && (
                    <div className="mb-4 p-4 bg-surface border border-border rounded-lg flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-highlight flex items-center justify-center">
                            <Key size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-foreground">Action Required</h4>
                            <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                                Generating videos requires a paid API key. Please select a key from a project with billing enabled.
                            </p>
                        </div>
                        <button 
                            onClick={handleSelectApiKey}
                            className="bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                        >
                            Select API Key
                        </button>
                        <div className="text-[10px] text-muted">
                             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:text-primary-light underline">Billing Documentation</a>
                        </div>
                    </div>
                )}

                {/* Remix Controls */}
                {genMode === 'remix' && (
                    <div className="mb-4 space-y-3 animate-in fade-in">
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Avatar Toggle */}
                            <button
                                onClick={() => setUseAvatar(!useAvatar)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                                    useAvatar
                                    ? 'bg-primary/20 border-primary/50 text-primary-light'
                                    : 'bg-surface border-border text-muted hover:border-muted'
                                }`}
                            >
                                {useAvatar ? <CheckSquare size={14} /> : <div className="w-3.5 h-3.5 border border-muted rounded-sm" />}
                                <div className="flex items-center gap-2">
                                    <UserCircle size={14} />
                                    <span>Use My Avatar</span>
                                </div>
                            </button>

                            {/* Reference Image Upload */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground text-xs hover:border-muted transition-colors"
                                >
                                    <Plus size={14} />
                                    Add Reference Image
                                </button>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    className="hidden" 
                                    ref={fileInputRef}
                                    onChange={handleRefImageChange} 
                                />
                            </div>
                        </div>

                        {/* Selected Reference Previews */}
                        {(refImages.length > 0 || useAvatar) && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {useAvatar && (
                                    <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 border-primary/50">
                                        <img src={selectedAuthor.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5">Avatar</div>
                                    </div>
                                )}
                                {refImages.map((file, idx) => (
                                    <div key={idx} className="relative w-12 h-12 shrink-0 group">
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            className="w-full h-full object-cover rounded-lg border border-border" 
                                            alt="Ref"
                                        />
                                        <button 
                                            onClick={() => removeRefImage(idx)}
                                            className="absolute -top-1 -right-1 bg-surface text-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-border"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="text-[10px] text-muted flex items-start gap-1">
                            <AlertCircle size={10} className="mt-0.5" />
                            <span>Select images to guide the AI. "Use My Avatar" adds your profile picture as a reference.</span>
                        </div>
                    </div>
                )}
                
                {/* Generation Input */}
                {(!hasApiKey && genMode === 'video') ? null : (
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={genMode === 'video' ? videoPrompt : imagePrompt}
                            onChange={(e) => genMode === 'video' ? setVideoPrompt(e.target.value) : setImagePrompt(e.target.value)}
                            placeholder={
                                genMode === 'text' ? "Describe the image (e.g., 'A cyberpunk city at night')..." : 
                                genMode === 'remix' ? "How should we change these images? (e.g. 'Make it look like a sketch')" :
                                "Describe the video (e.g., 'A neon hologram cat driving at top speed')"
                            }
                            className="flex-1 bg-surface border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={
                                (genMode !== 'video' && isImageGenerating) || 
                                (genMode === 'video' && isVideoGenerating) || 
                                (genMode === 'video' ? !videoPrompt : !imagePrompt) || 
                                (genMode === 'remix' && refImages.length === 0 && !useAvatar)
                            }
                            className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            {isImageGenerating || isVideoGenerating ? <RefreshCw size={14} className="animate-spin" /> : 'Generate'}
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {generationError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-500 text-sm animate-in fade-in">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium">Generation Issue</p>
                            <p className="opacity-90 text-xs mt-0.5">{generationError}</p>
                        </div>
                    </div>
                )}

                {/* Video Generation Feedback */}
                {isVideoGenerating && (
                    <div className="mb-4 p-4 bg-surface rounded-lg flex items-center gap-3 animate-pulse border border-border">
                        <Loader2 size={24} className="text-accent animate-spin" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Dreaming up your video...</p>
                            <p className="text-xs text-muted">This can take a minute or two. Hang tight!</p>
                        </div>
                    </div>
                )}

                {/* Video Result */}
                {genMode === 'video' && generatedVideo && (
                    <div className="mb-4">
                        <p className="text-xs text-muted mb-2">Generated Video (Shorts Format):</p>
                        <div className="relative w-40 aspect-[9/16] rounded-xl overflow-hidden border border-border group">
                            <video 
                                src={generatedVideo} 
                                className="w-full h-full object-cover" 
                                controls 
                                autoPlay 
                                loop 
                            />
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                Ready
                            </div>
                        </div>
                        <p className="text-[10px] text-muted mt-2">
                           Your video is attached above. You can post it now!
                        </p>
                    </div>
                )}

                {/* Grid of Generated Images */}
                {genMode !== 'video' && (isImageGenerating || generatedCandidates.length > 0) && (
                    <div className="space-y-3">
                        {/* Select All Action */}
                        {!isImageGenerating && generatedCandidates.length > 0 && (
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleSelectAllGenerated}
                                    className="text-xs flex items-center gap-1.5 text-primary-light hover:text-foreground transition-colors"
                                >
                                    <CheckSquare size={14} />
                                    <span>Select All</span>
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Render Available Candidates */}
                            {generatedCandidates.map((imgData, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => toggleGeneratedImageSelection(imgData, idx)}
                                    className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all animate-in fade-in zoom-in-50 duration-300 ${
                                        addedCandidateIndices.has(idx)
                                        ? 'border-primary ring-2 ring-primary/50 opacity-70' 
                                        : 'border-transparent hover:border-muted'
                                    }`}
                                >
                                    <img src={`data:image/png;base64,${imgData}`} className="w-full h-full object-cover" alt={`Generated option ${idx + 1}`} />
                                    
                                    {/* Overlay */}
                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${addedCandidateIndices.has(idx) ? 'bg-primary/40' : 'bg-transparent hover:bg-black/20'}`}>
                                    {addedCandidateIndices.has(idx) ? (
                                        <div className="bg-primary rounded-full p-1 shadow-lg animate-in zoom-in">
                                            <Check size={16} className="text-white"/>
                                        </div>
                                    ) : (
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                                            <Plus size={20} className="text-white"/>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            ))}

                            {/* Loading Skeletons for remaining items */}
                            {isImageGenerating && (
                                <div className="aspect-square bg-surface-highlight rounded-lg animate-pulse flex items-center justify-center">
                                    <Loader2 size={20} className="text-muted animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          )}
          
          {/* AI Suggestions (if generated) */}
          {Object.entries(optimizedVersions).length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
                  {Object.entries(optimizedVersions).map(([pid, data]: [string, { text: string; hashtags: string[] }]) => (
                      <div key={pid} className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-primary-light uppercase">{pid} Version</span>
                             <button 
                                onClick={() => applyOptimizedContent(pid)}
                                className="text-xs bg-primary hover:bg-primary-hover text-white px-2 py-1 rounded"
                             >
                                Apply
                             </button>
                          </div>
                          <p className="text-xs text-muted line-clamp-3 italic">
                              "{data.text}"
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                              {data.hashtags.slice(0, 3).map(t => <span key={t} className="text-[10px] text-accent">{t}</span>)}
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-highlight rounded-full p-1">
                <label className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-full cursor-pointer transition-colors" title="Upload Image">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  <ImageIcon size={18} />
                </label>
                <div className="w-px h-4 bg-border mx-1"></div>
                <button 
                    onClick={() => { setShowImageGen(!showImageGen); }}
                    className={`p-2 rounded-full transition-colors ${showImageGen ? 'text-primary bg-primary/10' : 'text-muted hover:text-primary hover:bg-surface'}`}
                    title="Generate with AI"
                >
                    <Wand2 size={18} />
                </button>
            </div>
            
            <button 
                onClick={handleSmartOptimize}
                disabled={isGenerating || !content || selectedPlatforms.length <= 1}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ml-2 ${
                    isGenerating || !content || selectedPlatforms.length <= 1
                    ? 'text-muted cursor-not-allowed'
                    : 'text-accent bg-accent/10 hover:bg-accent/20'
                }`}
            >
              {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>AI Optimize</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted">
                Posting to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handlePostSubmit}
              disabled={(!content && images.length === 0 && !generatedVideo) || isGenerating}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              <span>Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;