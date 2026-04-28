import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateCaseTitle } from "@/lib/utils";

// GET /api/cases — list user's cases
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const cases = await prisma.case.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      documents: {
        select: { id: true, status: true, pdfUrl: true },
      },
    },
  });

  return NextResponse.json({ success: true, data: cases });
}

// POST /api/cases — create or update a case

/**
 * violationData and contestationGrounds are stored as JSON text in SQLite
 * (schema: String?).  All writes must go through JSON.stringify and all reads
 * through JSON.parse — see safeJsonParse() in generate/route.ts.
 *
 * z.any() is intentionally kept to accommodate the union of different
 * violation-type shapes (speeding vs parking vs other) without duplicating
 * the full schema here.  Structural validation happens at template generation.
 */
const caseSchema = z.object({
  id:                  z.string().optional(),
  caseType:            z.enum(["SPEEDING","PARKING","ADMIN_ERROR","MOBILE_PHONE","SEATBELT","TRAFFIC_LIGHT","OTHER"]),
  fineNumber:          z.string().max(100).optional(),
  fineDate:            z.string().optional(),
  fineEntity:          z.string().max(100).optional(),
  fineLocation:        z.string().max(300).optional(),
  vehiclePlate:        z.string().max(20).optional(),
  vehicleOwnerName:    z.string().max(200).optional(),
  vehicleOwnerNif:     z.string().max(20).optional(),
  vehicleOwnerAddress: z.string().max(500).optional(),
  violationData:       z.record(z.unknown()).optional(),
  contestationGrounds: z.array(z.object({
    id:         z.string(),
    label:      z.string(),
    legalBasis: z.string().optional(),
    selected:   z.boolean().optional(),
  })).optional(),
  additionalNotes:     z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const parsed = caseSchema.parse(body);

    const title = generateCaseTitle(parsed.caseType, parsed.fineDate);

    if (parsed.id) {
      // Update existing case
      const existing = await prisma.case.findFirst({
        where: { id: parsed.id, userId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
      }

      const updated = await prisma.case.update({
        where: { id: parsed.id },
        data: {
          title,
          caseType:            parsed.caseType,
          fineNumber:          parsed.fineNumber,
          fineDate:            parsed.fineDate ? new Date(parsed.fineDate) : undefined,
          fineEntity:          parsed.fineEntity,
          fineLocation:        parsed.fineLocation,
          vehiclePlate:        parsed.vehiclePlate,
          vehicleOwnerName:    parsed.vehicleOwnerName,
          // Serialize to JSON text — schema.prisma defines these as String?
          violationData:       parsed.violationData
            ? JSON.stringify(parsed.violationData)
            : undefined,
          contestationGrounds: parsed.contestationGrounds
            ? JSON.stringify(parsed.contestationGrounds)
            : undefined,
          additionalNotes:     parsed.additionalNotes,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create new case
    const newCase = await prisma.case.create({
      data: {
        userId,
        title,
        caseType:            parsed.caseType,
        fineNumber:          parsed.fineNumber,
        fineDate:            parsed.fineDate ? new Date(parsed.fineDate) : undefined,
        fineEntity:          parsed.fineEntity,
        fineLocation:        parsed.fineLocation,
        vehiclePlate:        parsed.vehiclePlate,
        vehicleOwnerName:    parsed.vehicleOwnerName,
        // Serialize to JSON text — schema.prisma defines these as String?
        violationData:       JSON.stringify(parsed.violationData ?? {}),
        contestationGrounds: JSON.stringify(parsed.contestationGrounds ?? []),
        additionalNotes:     parsed.additionalNotes,
        status:              "DRAFT",
      },
    });

    return NextResponse.json({ success: true, data: newCase }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[CASES POST]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
