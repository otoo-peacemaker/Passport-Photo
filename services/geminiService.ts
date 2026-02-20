
import { GoogleGenAI } from "@google/genai";
import { ImageSize, GeminiResponse, StyleOptions } from "../types";

export const editPassportPhoto = async (
  base64Image: string,
  size: ImageSize,
  options: StyleOptions
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format");
  }
  const mimeType = match[1];
  const imageData = match[2];

  // Map user-friendly labels to prompt descriptions
  const colorMap = {
    'sea-blue': 'a vibrant sea blue',
    'navy': 'a deep navy blue',
    'black': 'a classic solid black',
    'charcoal': 'a professional charcoal grey'
  };

  const bgMap = {
    'transparent': 'COMPLETELY REMOVE the background. The background MUST be 100% transparent (alpha = 0). DO NOT generate any "checkerboard", "grid", or "pixel box" pattern. If I see a grey/white grid, it is a total failure. The background should be empty.',
    'white': 'replace the background with a solid, studio-standard white color.',
    'light-grey': 'replace the background with a professional light grey gradient.',
    'light-blue': 'replace the background with a standard passport-style light blue.'
  };

  // Construct dynamic enhancement instructions
  let stylePrompt = "";
  
  if (options.attire === 'suit') {
    stylePrompt += `- ATTIRE: Change the person's clothing to a high-end professional suit in ${colorMap[options.attireColor]}, paired with a crisp white formal shirt and a matching tie.\n`;
  } else if (options.attire === 'shirt') {
    stylePrompt += `- ATTIRE: Change the person's clothing to a crisp, well-pressed formal shirt in ${colorMap[options.attireColor]}.\n`;
  }

  if (options.addSmile) {
    stylePrompt += `- EXPRESSION: Adjust the face to have a subtle, natural, and friendly smile while keeping eyes focused on the camera.\n`;
  }

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
            text: `Please transform this portrait into a professional, high-quality passport photo. 
            
            Strict Technical Requirements:
            1. BACKGROUND: ${bgMap[options.outputBg]}
            2. POSE: Straighten posture and head alignment perfectly. Ensure shoulders are level and the person is looking directly at the lens.
            3. LIGHTING: Ensure soft, balanced studio lighting without harsh shadows.
            4. CROP: Format to standard 3:4 passport proportions, focusing on head and shoulders.
            ${stylePrompt}
            
            IMPORTANT: The result must be a clean PNG. If transparency is requested, the background must NOT contain any visible pixels, colors, or patterns like a transparency grid. It must be an actual alpha channel.`,
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
