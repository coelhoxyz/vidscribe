"use client";

import { useState } from "react";
import { Camera, Loader2, ArrowRight, Link2 } from "lucide-react";

interface InstagramInputProps {
  onSubmit: (url: string, maxVideos?: number) => void;
  isLoading: boolean;
}

export function InstagramInput({ onSubmit, isLoading }: InstagramInputProps) {
  const [url, setUrl] = useState("");
  const [maxVideos, setMaxVideos] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Enter an Instagram profile URL or username");
      return;
    }

    if (!isValidInstagramInput(url)) {
      setError("Enter a valid Instagram URL or username");
      return;
    }

    const max = maxVideos ? parseInt(maxVideos, 10) : undefined;
    onSubmit(url, max);
  };

  return (
    <div className="glass rounded-2xl p-8 border-gradient">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">
            Instagram Profile
          </h3>
          <p className="text-gray-500 text-sm">
            Download and transcribe all videos from a profile
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <Link2 size={18} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://instagram.com/username"
            disabled={isLoading}
            className="w-full pl-12 pr-4 py-4 input-modern rounded-xl text-white placeholder-gray-600 focus:outline-none"
          />
          {error && (
            <p className="absolute -bottom-6 left-0 text-red-400 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="pt-2">
          <label className="text-gray-500 text-sm block mb-2">
            Max videos (optional, leave empty for all)
          </label>
          <input
            type="number"
            value={maxVideos}
            onChange={(e) => setMaxVideos(e.target.value)}
            placeholder="e.g. 10"
            min={1}
            disabled={isLoading}
            className="w-full px-4 py-3 input-modern rounded-xl text-white placeholder-gray-600 focus:outline-none"
          />
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
              Start Batch Transcription
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

function isValidInstagramInput(input: string): boolean {
  const trimmed = input.trim();
  // Bare username
  if (/^[A-Za-z0-9._]+$/.test(trimmed)) return true;
  // Instagram URL
  return /^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?/.test(
    trimmed
  );
}
