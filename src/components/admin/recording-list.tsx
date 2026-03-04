"use client";

import { useState } from "react";
import Link from "next/link";
import type { StreamWithCreator } from "@/types";

interface RecordingListProps {
  recordings: StreamWithCreator[];
}

export function RecordingList({ recordings }: RecordingListProps) {
  if (recordings.length === 0) {
    return <p className="text-sm text-gray-500">No recordings yet</p>;
  }

  return (
    <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
      {recordings.map((rec) => (
        <RecordingRow key={rec.id} recording={rec} />
      ))}
    </div>
  );
}

function RecordingRow({ recording }: { recording: StreamWithCreator }) {
  const [uploading, setUploading] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  async function handleUploadToDrive() {
    setUploading(true);
    try {
      const res = await fetch(`/api/recordings/${recording.id}/drive-upload`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setDriveUrl(data.driveUrl);
      }
    } catch {
      // Handle error
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <Link
          href={`/admin/recordings/${recording.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {recording.title}
        </Link>
        <p className="text-xs text-gray-500">
          {recording.endedAt
            ? new Date(recording.endedAt).toLocaleDateString()
            : "Unknown date"}
          {recording.duration
            ? ` · ${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {driveUrl ? (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 font-medium"
          >
            View in Drive
          </a>
        ) : (
          <button
            onClick={handleUploadToDrive}
            disabled={uploading}
            className="rounded px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Save to Drive"}
          </button>
        )}
      </div>
    </div>
  );
}
