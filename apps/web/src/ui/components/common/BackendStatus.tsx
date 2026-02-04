"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Cpu, Zap, Server } from "lucide-react";
import { api } from "@/infrastructure/api/client";

type Status = "checking" | "connected" | "disconnected";

interface BackendInfo {
  device: string;
  whisper_model: string;
  gpu_available: boolean;
}

export function BackendStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [info, setInfo] = useState<BackendInfo | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const data = await api.getStatus();
        setInfo(data);
        setStatus("connected");
      } catch {
        setStatus("disconnected");
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  if (status === "checking") {
    return (
      <div className="mb-8 p-4 glass rounded-xl flex items-center gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={18} />
        <span className="text-gray-400 text-sm">Connecting to backend...</span>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="mb-8 p-5 glass rounded-2xl border border-red-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-red-400" size={20} />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-red-400 font-semibold">Backend not connected</h4>
              <p className="text-gray-500 text-sm mt-1">
                The transcription backend is not running. Start it with:
              </p>
            </div>
            <code className="block p-3 bg-black/40 rounded-lg text-sm text-gray-300 font-mono border border-white/5">
              cd apps/api && uvicorn src.main:app --reload --port 8000
            </code>
            <p className="text-gray-600 text-xs flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
              All processing happens locally on your machine for privacy
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 p-4 glass rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Server className="text-emerald-400" size={16} />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-gray-300 text-sm font-medium">Backend connected</span>
        </div>
      </div>
      {info && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
            <Cpu size={14} className="text-gray-500" />
            <span className="text-gray-400 text-xs font-medium">{info.whisper_model}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${info.gpu_available ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
            <Zap size={14} className={info.gpu_available ? "text-emerald-400" : "text-gray-500"} />
            <span className={`text-xs font-medium ${info.gpu_available ? 'text-emerald-400' : 'text-gray-400'}`}>
              {info.device.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
