"use client";

import { useState } from "react";
import { Play, Loader2, ArrowRight, Link2, Plus, X } from "lucide-react";

interface YoutubeInputProps {
  onSubmit: (urls: string[]) => void;
  isLoading: boolean;
}

export function YoutubeInput({ onSubmit, isLoading }: YoutubeInputProps) {
  const [urls, setUrls] = useState([""]);
  const [error, setError] = useState("");

  const updateUrl = (index: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  };

  const addUrl = () => {
    setUrls((prev) => [...prev, ""]);
  };

  const removeUrl = (index: number) => {
    if (urls.length <= 1) return;
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const valid = urls.map((u) => u.trim()).filter(Boolean);
    if (valid.length === 0) {
      setError("Enter at least one YouTube URL");
      return;
    }

    const invalid = valid.find((u) => !isValidYoutubeUrl(u));
    if (invalid) {
      setError(`Invalid URL: ${invalid}`);
      return;
    }

    onSubmit(valid);
  };

  return (
    <div className="glass rounded-2xl p-8 border-gradient">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">YouTube Videos</h3>
          <p className="text-gray-500 text-sm">
            Paste one or more YouTube video URLs
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {urls.map((url, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Link2 size={18} />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3 input-modern rounded-xl text-white placeholder-gray-600 focus:outline-none text-sm"
              />
            </div>
            {urls.length > 1 && (
              <button
                type="button"
                onClick={() => removeUrl(index)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                disabled={isLoading}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="button"
          onClick={addUrl}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          Add another URL
        </button>

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
