import type { Transcription } from "@/domain/entities/Transcription";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StatusResponse {
  status: string;
  whisper_model: string;
  device: string;
  gpu_available: boolean;
}

interface ExportResponse {
  content: string | object;
  format: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getStatus(): Promise<StatusResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/status`);
    if (!res.ok) throw new Error("Backend not available");
    return res.json();
  }

  async transcribeFile(file: File): Promise<Transcription> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${this.baseUrl}/api/v1/transcriptions`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to start transcription");
    }

    return res.json();
  }

  async transcribeYoutube(url: string): Promise<Transcription> {
    const formData = new FormData();
    formData.append("youtube_url", url);

    const res = await fetch(`${this.baseUrl}/api/v1/transcriptions`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to start transcription");
    }

    return res.json();
  }

  async getTranscription(id: string): Promise<Transcription> {
    const res = await fetch(`${this.baseUrl}/api/v1/transcriptions/${id}`);
    if (!res.ok) throw new Error("Failed to get transcription");
    return res.json();
  }

  async exportTranscription(
    id: string,
    format: string
  ): Promise<ExportResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/transcriptions/${id}/export?format=${format}`
    );
    if (!res.ok) throw new Error("Failed to export transcription");
    return res.json();
  }

}

export const api = new ApiClient(API_URL);
