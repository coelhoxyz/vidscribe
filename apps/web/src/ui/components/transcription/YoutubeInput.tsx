"use client";

import { useState } from "react";
import { Play, Loader2, ArrowRight, Link2 } from "lucide-react";

interface YoutubeInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function YoutubeInput({ onSubmit, isLoading }: YoutubeInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!isValidYoutubeUrl(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    onSubmit(url);
  };

  return (
    <div className="glass rounded-2xl p-8 border-gradient">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">YouTube Video</h3>
          <p className="text-gray-500 text-sm">Paste any YouTube video URL</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <Link2 size={18} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            disabled={isLoading}
            className="w-full pl-12 pr-4 py-4 input-modern rounded-xl text-white placeholder-gray-600 focus:outline-none"
          />
          {error && (
            <p className="absolute -bottom-6 left-0 text-red-400 text-sm">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-200
            ${isLoading ? "bg-gray-800 cursor-not-allowed" : "btn-primary"}
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Start Transcription
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-gray-600 text-xs">
        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
        <span>All processing happens locally on your machine</span>
      </div>
    </div>
  );
}

function isValidYoutubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ];
  return patterns.some((pattern) => pattern.test(url));
}
