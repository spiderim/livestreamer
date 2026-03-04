import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Authentication Error
        </h1>
        <p className="text-sm text-gray-600">
          Something went wrong during sign in. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
