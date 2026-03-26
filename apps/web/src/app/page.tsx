"use client";

import { useState } from "react";
import { Upload, Play, Camera } from "lucide-react";
import { Header } from "@/ui/components/layout/Header";
import { VideoUploader } from "@/ui/components/transcription/VideoUploader";
import { YoutubeInput } from "@/ui/components/transcription/YoutubeInput";
import { InstagramInput } from "@/ui/components/transcription/InstagramInput";
import { TranscriptionProgress } from "@/ui/components/transcription/TranscriptionProgress";
import { TranscriptionResult } from "@/ui/components/transcription/TranscriptionResult";
import { BatchProgress } from "@/ui/components/transcription/BatchProgress";
import { BatchResult } from "@/ui/components/transcription/BatchResult";
import { BackendStatus } from "@/ui/components/common/BackendStatus";
import { useTranscription } from "@/ui/hooks/useTranscription";
import { useBatchTranscription } from "@/ui/hooks/useBatchTranscription";

type Tab = "upload" | "youtube" | "instagram";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const {
    transcription,
    isLoading,
    error,
    transcribeFile,
    transcribeYoutube,
    reset,
  } = useTranscription();

  const {
    batches,
    transcriptions: batchTranscriptions,
    isLoading: batchLoading,
    error: batchError,
    transcribeProfiles,
    transcribeYoutubeUrls,
    reset: resetBatch,
  } = useBatchTranscription();

  const handleFileUpload = async (file: File) => {
    await transcribeFile(file);
  };

  const handleYoutubeSubmit = async (urls: string[]) => {
    if (urls.length === 1) {
      await transcribeYoutube(urls[0]);
    } else {
      await transcribeYoutubeUrls(urls);
    }
  };

  const handleInstagramSubmit = async (profiles: { url: string; maxVideos?: number }[]) => {
    await transcribeProfiles(profiles);
  };

  const showResult = transcription?.status === "completed";
  const showProgress =
    transcription &&
    ["pending", "downloading", "extracting_audio", "transcribing"].includes(
      transcription.status
    );

  const showBatchProgress =
    batches.length > 0 &&
    batches.some((b) => ["pending", "enumerating", "processing"].includes(b.status));
  const showBatchResult =
    batches.length > 0 &&
    batches.every((b) => b.status === "completed" || b.status === "failed");

  const showInput = !showProgress && !showResult && !showBatchProgress && !showBatchResult;

  const currentError = (activeTab === "instagram" || activeTab === "youtube") ? (batchError || error) : error;

  const handleReset = () => {
    reset();
    resetBatch();
  };

  return (
    <div className="min-h-screen bg-[#030303] gradient-bg">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <BackendStatus />

        {showInput && (
          <>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-gray-400 mb-6">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse-glow"></span>
                Powered by OpenAI Whisper
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-5 leading-tight">
                Transcribe Videos<br />with AI
              </h1>
              <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
                Upload a video file, paste a YouTube link, or transcribe an entire Instagram profile.<br />
                <span className="text-gray-600">All processing happens locally on your machine.</span>
              </p>
            </div>

            <div className="flex justify-center mb-10">
              <div className="glass p-1.5 rounded-2xl inline-flex gap-1">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === "upload"
                      ? "accent-gradient text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Upload size={18} />
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab("youtube")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === "youtube"
                      ? "accent-gradient text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Play size={18} />
                  YouTube
                </button>
                <button
                  onClick={() => setActiveTab("instagram")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === "instagram"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Camera size={18} />
                  Instagram
                </button>
              </div>
            </div>

            {activeTab === "upload" && (
              <VideoUploader onUpload={handleFileUpload} isLoading={isLoading} />
            )}
            {activeTab === "youtube" && (
              <YoutubeInput onSubmit={handleYoutubeSubmit} isLoading={isLoading || batchLoading} />
            )}
            {activeTab === "instagram" && (
              <InstagramInput
                onSubmit={handleInstagramSubmit}
                isLoading={batchLoading}
              />
            )}

            {currentError && (
              <div className="mt-6 p-4 glass rounded-xl border border-red-500/20 text-red-400 text-sm">
                {currentError}
              </div>
            )}
          </>
        )}

        {showProgress && transcription && (
          <TranscriptionProgress transcription={transcription} />
        )}

        {showResult && transcription && (
          <TranscriptionResult transcription={transcription} onReset={handleReset} />
        )}

        {showBatchProgress && (
          <BatchProgress batches={batches} transcriptions={batchTranscriptions} />
        )}

        {showBatchResult && (
          <BatchResult
            batches={batches}
            transcriptions={batchTranscriptions}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
