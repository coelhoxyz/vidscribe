"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, FileAudio, Mic } from "lucide-react";
import type { Transcription } from "@/domain/entities/Transcription";

interface TranscriptionProgressProps {
  transcription: Transcription;
}

const statusLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  pending: { label: "Starting...", icon: <Loader2 className="animate-spin" /> },
  downloading: { label: "Downloading video...", icon: <Download /> },
  extracting_audio: { label: "Extracting audio...", icon: <FileAudio /> },
  transcribing: { label: "Transcribing with AI...", icon: <Mic /> },
};

export function TranscriptionProgress({
  transcription,
}: TranscriptionProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const statusInfo = statusLabels[transcription.status] || {
    label: "Processing...",
    icon: <Loader2 className="animate-spin" />,
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 text-white">
          {statusInfo.icon}
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">
          {statusInfo.label}
          {dots}
        </h2>

        {transcription.source_name && (
          <p className="text-gray-400 mb-6">{transcription.source_name}</p>
        )}

        <div className="w-full max-w-md">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(transcription.progress)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${transcription.progress}%` }}
            />
          </div>
        </div>

        <p className="mt-6 text-gray-600 text-sm">
          Processing happens locally on your machine. This may take a few
          minutes depending on the video length.
        </p>
      </div>
    </div>
  );
}
