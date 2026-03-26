"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  BatchTranscription,
  Transcription,
} from "@/domain/entities/Transcription";
import { api } from "@/infrastructure/api/client";

interface UseBatchTranscriptionReturn {
  batches: BatchTranscription[];
  transcriptions: Transcription[];
  isLoading: boolean;
  error: string | null;
  transcribeProfiles: (
    profiles: { url: string; maxVideos?: number }[]
  ) => Promise<void>;
  reset: () => void;
}

export function useBatchTranscription(): UseBatchTranscriptionReturn {
  const [batches, setBatches] = useState<BatchTranscription[]>([]);
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
    (ids: string[]) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const updatedBatches = await Promise.all(
            ids.map((id) => api.getBatchTranscription(id))
          );
          setBatches(updatedBatches);

          const allTranscriptionIds = updatedBatches.flatMap(
            (b) => b.transcription_ids
          );
          if (allTranscriptionIds.length > 0) {
            const results = await Promise.all(
              allTranscriptionIds.map((tid) =>
                api.getTranscription(tid).catch(() => null)
              )
            );
            setTranscriptions(
              results.filter((t): t is Transcription => t !== null)
            );
          }

          const allDone = updatedBatches.every(
            (b) => b.status === "completed" || b.status === "failed"
          );
          if (allDone) {
            stopPolling();
          }
        } catch {
          // Continue polling on transient errors
        }
      }, 2000);
    },
    [stopPolling]
  );

  const transcribeProfiles = useCallback(
    async (profiles: { url: string; maxVideos?: number }[]) => {
      setIsLoading(true);
      setError(null);
      setBatches([]);
      setTranscriptions([]);
      stopPolling();

      try {
        const results = await Promise.all(
          profiles.map((p) =>
            api.transcribeInstagramProfile(p.url, p.maxVideos)
          )
        );
        setBatches(results);
        startPolling(results.map((r) => r.id));
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
    setBatches([]);
    setTranscriptions([]);
    setError(null);
  }, [stopPolling]);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  return {
    batches,
    transcriptions,
    isLoading,
    error,
    transcribeProfiles,
    reset,
  };
}
