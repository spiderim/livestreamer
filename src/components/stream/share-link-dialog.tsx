"use client";

import { useState } from "react";

interface ShareLinkDialogProps {
  slug: string;
}

export function ShareLinkDialog({ slug }: ShareLinkDialogProps) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/watch/${slug}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Shareable Link
      </label>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
        />
        <button
          onClick={copyToClipboard}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
