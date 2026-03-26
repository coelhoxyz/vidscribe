"use client";

import { useState } from "react";
import { Camera, Loader2, ArrowRight, Link2, Plus, X } from "lucide-react";

interface ProfileEntry {
  url: string;
  maxVideos: string;
}

interface InstagramInputProps {
  onSubmit: (profiles: { url: string; maxVideos?: number }[]) => void;
  isLoading: boolean;
}

export function InstagramInput({ onSubmit, isLoading }: InstagramInputProps) {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([
    { url: "", maxVideos: "" },
  ]);
  const [error, setError] = useState("");

  const updateProfile = (index: number, field: keyof ProfileEntry, value: string) => {
    setProfiles((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addProfile = () => {
    setProfiles((prev) => [...prev, { url: "", maxVideos: "" }]);
  };

  const removeProfile = (index: number) => {
    if (profiles.length <= 1) return;
    setProfiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const valid = profiles.filter((p) => p.url.trim());
    if (valid.length === 0) {
      setError("Enter at least one Instagram profile URL or username");
      return;
    }

    const invalid = valid.find((p) => !isValidInstagramInput(p.url));
    if (invalid) {
      setError(`Invalid profile: "${invalid.url}"`);
      return;
    }

    onSubmit(
      valid.map((p) => ({
        url: p.url.trim(),
        maxVideos: p.maxVideos ? parseInt(p.maxVideos, 10) : undefined,
      }))
    );
  };

  return (
    <div className="glass rounded-2xl p-8 border-gradient">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">
            Instagram Profiles
          </h3>
          <p className="text-gray-500 text-sm">
            Download and transcribe videos from one or more profiles
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {profiles.map((profile, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Link2 size={18} />
                </div>
                <input
                  type="text"
                  value={profile.url}
                  onChange={(e) => updateProfile(index, "url", e.target.value)}
                  placeholder="https://instagram.com/username"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 input-modern rounded-xl text-white placeholder-gray-600 focus:outline-none text-sm"
                />
              </div>
              <input
                type="number"
                value={profile.maxVideos}
                onChange={(e) => updateProfile(index, "maxVideos", e.target.value)}
                placeholder="Max videos (empty = all)"
                min={1}
                disabled={isLoading}
                className="w-full px-4 py-2 input-modern rounded-lg text-white placeholder-gray-600 focus:outline-none text-sm"
              />
            </div>
            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => removeProfile(index)}
                className="mt-3 p-2 text-gray-500 hover:text-red-400 transition-colors"
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
          onClick={addProfile}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          Add another profile
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
  if (/^[A-Za-z0-9._]+$/.test(trimmed)) return true;
  return /^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?/.test(trimmed);
}
