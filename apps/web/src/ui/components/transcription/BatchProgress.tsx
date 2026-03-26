"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  Mic,
  Check,
  X,
  Clock,
} from "lucide-react";
import type {
  BatchTranscription,
  Transcription,
} from "@/domain/entities/Transcription";

interface BatchProgressProps {
  batch: BatchTranscription;
  transcriptions: Transcription[];
}

const batchStatusLabels: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Starting...",
    icon: <Loader2 className="animate-spin" />,
  },
  enumerating: {
    label: "Finding videos on profile...",
    icon: <Search />,
  },
  processing: {
    label: "Transcribing videos...",
    icon: <Mic />,
  },
};

function VideoStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Check className="w-4 h-4 text-emerald-400" />;
    case "failed":
      return <X className="w-4 h-4 text-red-400" />;
    case "downloading":
    case "extracting_audio":
    case "transcribing":
      return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-gray-600" />;
  }
}

export function BatchProgress({
  batch,
  transcriptions,
}: BatchProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const statusInfo = batchStatusLabels[batch.status] || {
    label: "Processing...",
    icon: <Loader2 className="animate-spin" />,
  };

  const processed = batch.completed_videos + batch.failed_videos;

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-8 space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 text-white">
          {statusInfo.icon}
        </div>

        <h2 className="text-xl font-semibold text-white mb-1">
          {statusInfo.label}
          {dots}
        </h2>

        <p className="text-gray-400 mb-6">@{batch.profile_username}</p>

        {batch.total_videos > 0 && (
          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>
                {processed} of {batch.total_videos} videos
              </span>
              <span>{Math.round(batch.progress)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                style={{ width: `${batch.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {transcriptions.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {transcriptions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-lg"
            >
              <VideoStatusIcon status={t.status} />
              <span className="text-gray-300 text-sm truncate flex-1">
                {t.source_name || t.id.slice(0, 8)}
              </span>
              {t.status === "transcribing" && (
                <span className="text-gray-500 text-xs">
                  {Math.round(t.progress)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-gray-600 text-sm">
        Processing happens locally. This may take a while for many videos.
      </p>
    </div>
  );
}
