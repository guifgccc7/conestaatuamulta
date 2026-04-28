import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({}, { status: 401 });

  const userId = (session.user as { id: string }).id;

  await prisma.case.updateMany({
    where: { id: params.id, userId },
    data: { status: "DOWNLOADED" },
  });

  return NextResponse.json({ success: true });
}
