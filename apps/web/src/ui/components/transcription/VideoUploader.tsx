"use client";

import { useCallback, useState } from "react";
import { Upload, FileVideo, Loader2, CloudUpload } from "lucide-react";

interface VideoUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function VideoUploader({ onUpload, isLoading }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && isVideoFile(file)) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative rounded-2xl p-10 text-center transition-all duration-300 border-gradient
        ${
          isDragging
            ? "glass border-indigo-500/50 glow"
            : "glass glass-hover"
        }
        ${isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
      `}
    >
      <input
        type="file"
        accept="video/*,audio/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-5">
        <div className={`
          w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
          ${isDragging ? "accent-gradient glow" : "bg-white/5 border border-white/10"}
        `}>
          {isLoading ? (
            <Loader2 className="w-9 h-9 text-white animate-spin" />
          ) : isDragging ? (
            <FileVideo className="w-9 h-9 text-white" />
          ) : (
            <CloudUpload className="w-9 h-9 text-gray-400" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-white font-semibold text-lg">
            {isLoading
              ? "Uploading..."
              : isDragging
              ? "Drop your file here"
              : "Drop your video here"}
          </p>
          <p className="text-gray-500 text-sm">
            or <span className="text-indigo-400 hover:text-indigo-300 transition-colors">browse</span> to choose a file
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {["MP4", "WebM", "MOV", "AVI", "MP3", "WAV"].map((format) => (
            <span key={format} className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white/5 rounded-md uppercase tracking-wider">
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || file.type.startsWith("audio/");
}
