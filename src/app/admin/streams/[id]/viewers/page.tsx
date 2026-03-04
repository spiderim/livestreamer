import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ViewerList } from "@/components/admin/viewer-list";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ViewersPage({ params }: Props) {
  const { id } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  });

  if (!stream) return notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Viewers - {stream.title}
      </h1>
      <ViewerList streamId={stream.id} />
    </div>
  );
}
