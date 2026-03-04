export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [liveCount, recordedCount, userCount] = await Promise.all([
    prisma.stream.count({ where: { status: "LIVE" } }),
    prisma.stream.count({ where: { status: "RECORDED" } }),
    prisma.user.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Live Streams</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{liveCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Recordings</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {recordedCount}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{userCount}</p>
        </div>
      </div>
    </div>
  );
}
