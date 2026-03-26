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
  source_type: "upload" | "youtube" | "instagram";
  source_name?: string;
  progress: number;
  text?: string;
  language?: string;
  error?: string;
}

export type BatchStatus =
  | "pending"
  | "enumerating"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface BatchTranscription {
  id: string;
  status: BatchStatus;
  profile_username: string;
  total_videos: number;
  completed_videos: number;
  failed_videos: number;
  progress: number;
  transcription_ids: string[];
  error?: string;
}
