
export type ImageSize = '1K' | '2K' | '4K';
export type PreviewBgColor = 'transparent' | 'white' | 'blue' | 'grey';

export interface EditorState {
  originalImage: string | null;
  processedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  selectedSize: ImageSize;
  previewBg: PreviewBgColor;
}

export interface GeminiResponse {
  imageUrl: string | null;
  text: string | null;
}
