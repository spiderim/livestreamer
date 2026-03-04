"use client";

import { useRouter, useParams } from "next/navigation";
import { PasswordForm } from "@/components/stream/password-form";

export default function PasswordPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Protected Stream</h1>
          <p className="mt-1 text-sm text-gray-600">
            This stream requires a password to watch
          </p>
        </div>
        <PasswordForm
          streamId={slug}
          onSuccess={() => router.push(`/streams/${slug}`)}
        />
      </div>
    </div>
  );
}
