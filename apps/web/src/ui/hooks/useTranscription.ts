"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Transcription } from "@/domain/entities/Transcription";
import { api } from "@/infrastructure/api/client";

interface UseTranscriptionReturn {
  transcription: Transcription | null;
  isLoading: boolean;
  error: string | null;
  transcribeFile: (file: File) => Promise<void>;
  transcribeYoutube: (url: string) => Promise<void>;
  reset: () => void;
}

export function useTranscription(): UseTranscriptionReturn {
  const [transcription, setTranscription] = useState<Transcription | null>(null);
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
          const updated = await api.getTranscription(id);
          setTranscription(updated);

          if (updated.status === "completed" || updated.status === "failed") {
            stopPolling();
          }
        } catch {
          // Continue polling on transient errors
        }
      }, 1000);
    },
    [stopPolling]
  );

  const transcribeFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      stopPolling();

      try {
        const result = await api.transcribeFile(file);
        setTranscription(result);
        startPolling(result.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start transcription");
      } finally {
        setIsLoading(false);
      }
    },
    [stopPolling, startPolling]
  );

  const transcribeYoutube = useCallback(
    async (url: string) => {
      setIsLoading(true);
      setError(null);
      stopPolling();

      try {
        const result = await api.transcribeYoutube(url);
        setTranscription(result);
        startPolling(result.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start transcription");
      } finally {
        setIsLoading(false);
      }
    },
    [stopPolling, startPolling]
  );

  const reset = useCallback(() => {
    stopPolling();
    setTranscription(null);
    setError(null);
  }, [stopPolling]);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  return {
    transcription,
    isLoading,
    error,
    transcribeFile,
    transcribeYoutube,
    reset,
  };
}
