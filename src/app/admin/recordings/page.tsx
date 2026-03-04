export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { RecordingList } from "@/components/admin/recording-list";
import type { StreamWithCreator } from "@/types";

export default async function RecordingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const recordings = await prisma.stream.findMany({
    where: {
      status: "RECORDED",
      ...(isSuperAdmin ? {} : { creatorId: session.user.id }),
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
    },
    orderBy: { endedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
      <RecordingList recordings={recordings as unknown as StreamWithCreator[]} />
    </div>
  );
}
