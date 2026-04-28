import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIP, tooManyRequests } from "@/lib/rate-limit";
import { logger, AUDIT } from "@/lib/logger";

// RGPD art. 7.º — keep version in sync with the privacy policy slug at /legal/privacidade
const CURRENT_PRIVACY_POLICY_VERSION = "2026-04";

const registerSchema = z.object({
  name:     z.string().min(2, "Nome obrigatório"),
  email:    z.string().email("Email inválido"),
  password: z.string().min(8, "Palavra-passe deve ter pelo menos 8 caracteres"),
});

export async function POST(req: NextRequest) {
  // ── Rate limit: 5 registrations per hour per IP ─────────────────────────────
  const ip = getIP(req);
  const rl = rateLimit("register", ip, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    logger.warn("register", AUDIT.AUTH.RATE_LIMIT, { detail: `IP ${ip.slice(0, 8)}… exceeded register limit` });
    return tooManyRequests(rl);
  }

  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.warn("register", AUDIT.AUTH.REGISTER_DUPLICATE);
      return NextResponse.json(
        { error: "Já existe uma conta com este email." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password:      hashedPassword,
        // RGPD art. 7.º — record consent timestamp and policy version
        // Registering implies acceptance of the Terms of Service and acknowledgment
        // of the Privacy Policy (both linked on the registration page).
        consentGivenAt:  new Date(),
        consentVersion:  CURRENT_PRIVACY_POLICY_VERSION,
      },
    });

    logger.audit("register", AUDIT.AUTH.REGISTER_SUCCESS, { userId: user.id });
    return NextResponse.json(
      { success: true, message: "Conta criada com sucesso.", userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    logger.error("register", "REGISTER_ERROR", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
