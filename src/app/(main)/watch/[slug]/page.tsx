import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShareableLinkPage({ params }: Props) {
  const { slug } = await params;

  const stream = await prisma.stream.findUnique({
    where: { shareableSlug: slug },
    select: { id: true, shareableSlug: true, isPasswordProtected: true },
  });

  if (!stream) return notFound();

  if (stream.isPasswordProtected) {
    redirect(`/watch/${slug}/password`);
  }

  redirect(`/streams/${slug}`);
}
