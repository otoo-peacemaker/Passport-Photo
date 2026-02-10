
import { GoogleGenAI } from "@google/genai";
import { ImageSize, GeminiResponse } from "../types";

export const editPassportPhoto = async (
  base64Image: string,
  size: ImageSize
): Promise<GeminiResponse> => {
  // Create a fresh instance to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Extract mime type and data from data URL
  const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format");
  }
  const mimeType = match[1];
  const imageData = match[2];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData,
              mimeType: mimeType,
            },
          },
          {
            text: `Please edit this portrait into a professional, high-quality passport photo. 
            
            Strict Requirements:
            1. BACKGROUND: Completely remove the background and replace it with true alpha transparency. DO NOT use a checkerboard pattern or any placeholder texture. The resulting image MUST have a transparent alpha channel.
            2. POSE: Straighten the person's posture and head alignment. They should be looking directly at the camera with eyes level.
            3. QUALITY: Ensure the lighting is balanced, professional, and consistent across the face (studio quality).
            4. CROP: Format the image to standard passport photo proportions (roughly 3:4 aspect ratio), centered on the face with appropriate headspace.
            
            The final result must be a clean PNG with a transparent background.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: size
        }
      },
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    return { imageUrl, text };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED_OR_INVALID");
    }
    throw error;
  }
};
