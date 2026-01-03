import { GoogleGenAI, Type } from "@google/genai";
import { PlatformType } from "../types";

// Always use the environment variable directly when initializing the client.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const optimizeContentForPlatform = async (
  originalContent: string,
  platform: PlatformType
): Promise<{ text: string; hashtags: string[] }> => {
  if (!originalContent) return { text: "", hashtags: [] };

  try {
    // For basic text tasks like optimization, use the gemini-3-flash-preview model.
    const model = 'gemini-3-flash-preview';
    
    let prompt = `You are an expert social media manager. Rewrite the following text to be optimized for ${platform}.`;
    
    if (platform === PlatformType.X) {
      prompt += " Keep it under 280 characters. Make it punchy.";
    } else if (platform === PlatformType.INSTAGRAM) {
      prompt += " Focus on visual storytelling descriptions and include a line break before hashtags.";
    } else if (platform === PlatformType.TIKTOK) {
      prompt += " Write a short, engaging caption suitable for a video description.";
    } else if (platform === PlatformType.THREADS) {
      prompt += " Keep it conversational and open-ended to encourage replies.";
    }

    prompt += `\n\nOriginal Text: "${originalContent}"`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The rewritten content optimized for the platform",
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5-10 relevant hashtags",
            },
          },
          required: ["text", "hashtags"],
        },
      },
    });

    // response.text is a property that returns the string output.
    const result = JSON.parse(response.text || '{}');
    return {
      text: result.text || originalContent,
      hashtags: result.hashtags || []
    };
  } catch (error) {
    console.error("Gemini optimization failed:", error);
    // Fallback to original content on error
    return { text: originalContent, hashtags: [] };
  }
};

export const generatePostIdeas = async (topic: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 creative social media post ideas about: ${topic}. Return only the ideas as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    return ["Could not generate ideas. Try again."];
  }
};

// Standard Text-to-Image
export const generateImagesFromPrompt = async (
  prompt: string, 
  count: number = 2,
  onImageGenerated?: (base64: string) => void
): Promise<string[]> => {
  return generateImagesInternal({ parts: [{ text: prompt }] }, count, onImageGenerated);
};

// Image-to-Image / Remix (Text + Reference Images)
export const generateImagesWithReferences = async (
  prompt: string,
  referenceImagesBase64: string[],
  count: number = 2,
  onImageGenerated?: (base64: string) => void
): Promise<string[]> => {
  const parts: any[] = [];
  
  // Add reference images first
  referenceImagesBase64.forEach(base64 => {
    // Remove data URL prefix if present for the API call, strictly speaking inlineData needs raw base64
    const rawBase64 = base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "image/png", // Assuming PNG for simplicity, though API supports others
        data: rawBase64
      }
    });
  });

  // Add the text prompt
  parts.push({ text: prompt });

  return generateImagesInternal({ parts }, count, onImageGenerated);
};

// Internal helper to handle the API call loop and error handling
const generateImagesInternal = async (
  contents: any,
  count: number,
  onImageGenerated?: (base64: string) => void
): Promise<string[]> => {
  const results: string[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const response = await ai.models.generateContent({
model: 'gemini-1.5-flash',        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const data = part.inlineData.data;
            results.push(data);
            if (onImageGenerated) {
              onImageGenerated(data);
            }
          }
        }
      }

      // Add a delay between requests to avoid Rate Limit (429)
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    } catch (e: any) {
      let errorMsg = "Unknown error";
      if (e instanceof Error) {
        errorMsg = e.message;
      } else if (typeof e === 'string') {
        errorMsg = e;
      } else {
        // FIX: Never use JSON.stringify on raw SDK error objects as they often contain circular references.
        errorMsg = String(e);
      }
      
      const isQuotaError = errorMsg.includes("429") || 
        errorMsg.toLowerCase().includes("quota") || 
        errorMsg.includes("RESOURCE_EXHAUSTED");
      
      console.warn(`Image generation attempt ${i+1} failed.`, errorMsg);

      if (i === 0) {
        if (isQuotaError) {
          throw new Error("API Quota exceeded. Please wait a moment.");
        }
        throw new Error("Failed to generate image. " + errorMsg.substring(0, 100));
      }

      if (isQuotaError) {
        console.warn("Quota exceeded during batch generation. Stopping remaining requests.");
        break;
      }
    }
  }

  return results;
};

// Video Generation (Veo)
export const generateVideo = async (prompt: string): Promise<string | null> => {
  // IMPORTANT: Create a new instance right before the API call to ensure we use the latest injected API key.
  const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_API_KEY;
  const freshAi = new GoogleGenAI({ apiKey });  
  try {
    let operation = await freshAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16' // Shorts/Reels format
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10s as recommended
      operation = await freshAi.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return null;

    // The URI requires the API key appended to fetch the binary content
    const response = await fetch(`${videoUri}&key=${import.meta.env.VITE_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (e: any) {
    console.error("Video generation failed", e);
    
    let errorMsg = e.message || String(e);
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      throw new Error("Video generation quota exceeded.");
    }
    throw e;
  }
};
