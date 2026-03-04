"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import type { StreamTokenResponse } from "@/types/stream";

interface StreamPlayerProps {
  streamId: string;
}

function VideoRenderer() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: true,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const videoTrack = tracks[0];

  if (!videoTrack) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white">
        <div className="text-center space-y-2">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm">Waiting for stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full bg-black cursor-pointer group"
      onDoubleClick={toggleFullscreen}
    >
      <VideoTrack
        trackRef={videoTrack}
        className="h-full w-full object-contain"
      />

      {/* Fullscreen button - shows on hover */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-3 right-3 rounded-md bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m7 1l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m7-1l5 5m0 0v-4m0 4h-4" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        )}
      </button>

      {/* LIVE badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        LIVE
      </div>
    </div>
  );
}

export function StreamPlayer({ streamId }: StreamPlayerProps) {
  const [tokenData, setTokenData] = useState<StreamTokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      try {
        const res = await fetch(`/api/streams/${streamId}/token`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to join stream");
          return;
        }
        const data: StreamTokenResponse = await res.json();
        setTokenData(data);
      } catch {
        setError("Failed to connect to stream");
      }
    }
    getToken();
  }, [streamId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-900 text-red-400">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-2">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.wsUrl}
      connect={true}
      className="h-full"
    >
      <VideoRenderer />
    </LiveKitRoom>
  );
}
