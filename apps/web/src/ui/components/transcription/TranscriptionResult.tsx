"use client";

import { useState } from "react";
import { Check, Copy, Download, RotateCcw, FileText } from "lucide-react";
import type { Transcription } from "@/domain/entities/Transcription";
import { api } from "@/infrastructure/api/client";

interface TranscriptionResultProps {
  transcription: Transcription;
  onReset: () => void;
}

type ExportFormat = "txt" | "srt" | "vtt" | "json";

export function TranscriptionResult({
  transcription,
  onReset,
}: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleCopy = async () => {
    if (transcription.text) {
      await navigator.clipboard.writeText(transcription.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      const result = await api.exportTranscription(transcription.id, format);
      const content =
        format === "json" ? JSON.stringify(result.content, null, 2) : String(result.content);

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcription.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transcription Complete</h2>
          {transcription.source_name && (
            <p className="text-gray-400">{transcription.source_name}</p>
          )}
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <RotateCcw size={18} />
          New Transcription
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FileText size={16} />
            <span>Detected language: {transcription.language || "Unknown"}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
            {transcription.text}
          </p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-6">
        <h3 className="text-white font-medium mb-4">Export Options</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["txt", "srt", "vtt", "json"] as ExportFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={exporting !== null}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="mt-4 text-gray-600 text-xs">
          SRT and VTT formats include timestamps for subtitles
        </p>
      </div>
    </div>
  );
}
