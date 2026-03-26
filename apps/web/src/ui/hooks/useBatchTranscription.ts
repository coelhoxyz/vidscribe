"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  BatchTranscription,
  Transcription,
} from "@/domain/entities/Transcription";
import { api } from "@/infrastructure/api/client";

interface UseBatchTranscriptionReturn {
  batch: BatchTranscription | null;
  transcriptions: Transcription[];
  isLoading: boolean;
  error: string | null;
  transcribeInstagramProfile: (
    url: string,
    maxVideos?: number
  ) => Promise<void>;
  reset: () => void;
}

export function useBatchTranscription(): UseBatchTranscriptionReturn {
  const [batch, setBatch] = useState<BatchTranscription | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const updated = await api.getBatchTranscription(id);
          setBatch(updated);

          if (updated.transcription_ids.length > 0) {
            const results = await Promise.all(
              updated.transcription_ids.map((tid) =>
                api.getTranscription(tid).catch(() => null)
              )
            );
            setTranscriptions(
              results.filter((t): t is Transcription => t !== null)
            );
          }

          if (
            updated.status === "completed" ||
            updated.status === "failed"
          ) {
            stopPolling();
          }
        } catch {
          // Continue polling on transient errors
        }
      }, 2000);
    },
    [stopPolling]
  );

  const transcribeInstagramProfile = useCallback(
    async (url: string, maxVideos?: number) => {
      setIsLoading(true);
      setError(null);
      setTranscriptions([]);
      stopPolling();

      try {
        const result = await api.transcribeInstagramProfile(url, maxVideos);
        setBatch(result);
        startPolling(result.id);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to start Instagram batch"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [stopPolling, startPolling]
  );

  const reset = useCallback(() => {
    stopPolling();
    setBatch(null);
    setTranscriptions([]);
    setError(null);
  }, [stopPolling]);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  return {
    batch,
    transcriptions,
    isLoading,
    error,
    transcribeInstagramProfile,
    reset,
  };
}
