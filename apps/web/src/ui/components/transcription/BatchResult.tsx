"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import type {
  BatchTranscription,
  Transcription,
} from "@/domain/entities/Transcription";
import { api } from "@/infrastructure/api/client";

interface BatchResultProps {
  batches: BatchTranscription[];
  transcriptions: Transcription[];
  onReset: () => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function VideoMetrics({ transcription }: { transcription: Transcription }) {
  const has = transcription.views_count || transcription.likes_count || transcription.comments_count;
  if (!has) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      {transcription.views_count != null && (
        <span className="flex items-center gap-1">
          <Eye size={12} /> {formatCount(transcription.views_count)}
        </span>
      )}
      {transcription.likes_count != null && (
        <span className="flex items-center gap-1">
          <Heart size={12} /> {formatCount(transcription.likes_count)}
        </span>
      )}
      {transcription.comments_count != null && (
        <span className="flex items-center gap-1">
          <MessageCircle size={12} /> {formatCount(transcription.comments_count)}
        </span>
      )}
    </div>
  );
}

function VideoResultItem({ transcription }: { transcription: Transcription }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (transcription.text) {
      await navigator.clipboard.writeText(transcription.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFailed = transcription.status === "failed";

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      <button
        onClick={() => !isFailed && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800/80 transition-colors"
      >
        {isFailed ? (
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        ) : (
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className="text-gray-300 text-sm truncate flex-1">
          {transcription.source_name || transcription.id.slice(0, 8)}
        </span>
        {transcription.language && (
          <span className="text-gray-600 text-xs">{transcription.language}</span>
        )}
        {!isFailed &&
          (expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
          ))}
      </button>

      {expanded && transcription.text && (
        <div className="px-4 pb-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between mt-2 mb-2">
            <VideoMetrics transcription={transcription} />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {transcription.text}
          </p>
        </div>
      )}

      {isFailed && (
        <div className="px-4 pb-3">
          <p className="text-red-400 text-xs">{transcription.error}</p>
        </div>
      )}
    </div>
  );
}

export function BatchResult({
  batches,
  transcriptions,
  onReset,
}: BatchResultProps) {
  const completed = transcriptions.filter((t) => t.status === "completed");
  const failed = transcriptions.filter((t) => t.status === "failed");
  const profileNames = batches.map((b) => `@${b.profile_username}`).join(", ");
  const filePrefix = batches.map((b) => b.profile_username).join("_");

  const handleExportAll = () => {
    const allText = completed
      .map((t) => {
        const metrics = [
          t.views_count != null ? `${formatCount(t.views_count)} views` : null,
          t.likes_count != null ? `${formatCount(t.likes_count)} likes` : null,
          t.comments_count != null ? `${formatCount(t.comments_count)} comments` : null,
        ].filter(Boolean).join(" · ");
        const header = `--- ${t.source_name || t.id} ---`;
        const metricsLine = metrics ? `${metrics}\n` : "";
        return `${header}\n${metricsLine}\n${t.text}\n`;
      })
      .join("\n");

    const blob = new Blob([allText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram_${filePrefix}_transcriptions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = async () => {
    const results = [];
    for (const t of completed) {
      try {
        const exported = await api.exportTranscription(t.id, "json");
        results.push({
          source_name: t.source_name,
          views_count: t.views_count,
          likes_count: t.likes_count,
          comments_count: t.comments_count,
          ...((exported.content as object) || {}),
        });
      } catch {
        results.push({ source_name: t.source_name, text: t.text });
      }
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram_${filePrefix}_transcriptions.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Batch Complete
          </h2>
          <p className="text-gray-400">
            {profileNames} &mdash; {completed.length} transcribed
            {failed.length > 0 && `, ${failed.length} failed`}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <RotateCcw size={18} />
          New Batch
        </button>
      </div>

      <div className="space-y-2 max-h-[28rem] overflow-y-auto">
        {transcriptions.map((t) => (
          <VideoResultItem key={t.id} transcription={t} />
        ))}
      </div>

      {completed.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Export All</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportAll}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Download size={16} />
              TXT
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Download size={16} />
              JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
