import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = params;

  const caseRecord = await prisma.case.findFirst({
    where: { id, userId },
    include: { documents: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!caseRecord) {
    return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
  }

  return NextResponse.json(caseRecord);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = params;

  const caseRecord = await prisma.case.findFirst({ where: { id, userId } });
  if (!caseRecord) {
    return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
  }

  await prisma.case.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
