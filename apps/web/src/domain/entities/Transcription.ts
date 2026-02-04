export type TranscriptionStatus =
  | "pending"
  | "downloading"
  | "extracting_audio"
  | "transcribing"
  | "completed"
  | "failed"
  | "cancelled";

export interface Transcription {
  id: string;
  status: TranscriptionStatus;
  source_type: "upload" | "youtube";
  source_name?: string;
  progress: number;
  text?: string;
  language?: string;
  error?: string;
}
