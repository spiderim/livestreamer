"use client";

import { useCallback } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

interface StreamPublisherProps {
  token: string;
  wsUrl: string;
  onDisconnect?: () => void;
}

function PublisherView() {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare],
    { onlySubscribed: false }
  );

  const toggleCamera = useCallback(async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  }, [localParticipant, isCameraEnabled]);

  const toggleMute = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleScreenShare = useCallback(async () => {
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  }, [localParticipant, isScreenShareEnabled]);

  const videoTrack = tracks.find(
    (t) =>
      t.source === Track.Source.ScreenShare ||
      t.source === Track.Source.Camera
  );

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
        {videoTrack ? (
          <VideoTrack
            trackRef={videoTrack}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white text-sm">
            Camera is off
          </div>
        )}

        {/* Live indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          LIVE
        </div>

        {/* Mic status indicator */}
        <div className="absolute top-3 right-3">
          {isMicrophoneEnabled ? (
            <span className="flex items-center gap-1 bg-green-600/80 text-white px-2 py-1 rounded text-xs">
              Mic On
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-red-600/80 text-white px-2 py-1 rounded text-xs">
              Mic Off
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={toggleCamera}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            !isCameraEnabled
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isCameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
        </button>

        <button
          onClick={toggleMute}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            !isMicrophoneEnabled
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            isScreenShareEnabled
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isScreenShareEnabled ? "Stop Screen Share" : "Share Screen"}
        </button>
      </div>
    </div>
  );
}

export function StreamPublisher({
  token,
  wsUrl,
  onDisconnect,
}: StreamPublisherProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={onDisconnect}
    >
      <PublisherView />
    </LiveKitRoom>
  );
}
