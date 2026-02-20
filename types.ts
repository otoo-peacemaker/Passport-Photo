
export type ImageSize = '1K' | '2K' | '4K';
export type PreviewBgColor = 'transparent' | 'white' | 'blue' | 'grey';

export type AttireType = 'none' | 'suit' | 'shirt';
export type AttireColor = 'sea-blue' | 'navy' | 'black' | 'charcoal';
export type OutputBgColor = 'transparent' | 'white' | 'light-grey' | 'light-blue';

export interface StyleOptions {
  attire: AttireType;
  attireColor: AttireColor;
  outputBg: OutputBgColor;
  addSmile: boolean;
}

export interface EditorState {
  originalImage: string | null;
  processedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  selectedSize: ImageSize;
  previewBg: PreviewBgColor;
  styleOptions: StyleOptions;
}

export interface GeminiResponse {
  imageUrl: string | null;
  text: string | null;
}
