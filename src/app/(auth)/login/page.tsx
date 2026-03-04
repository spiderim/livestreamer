import { LoginButton } from "@/components/auth/login-button";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Card */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-8 shadow-2xl space-y-6">
          {/* Logo + Title */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Watch and manage live streams
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Login Button */}
          <LoginButton />

          {/* Footer */}
          <p className="text-center text-xs text-gray-400">
            Sign in with your Google account to continue
          </p>
        </div>
      </div>
    </div>
  );
}
