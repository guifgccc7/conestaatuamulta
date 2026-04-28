import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding legal templates...");

  // Seed basic legal templates
  await prisma.legalTemplate.upsert({
    where: { slug: "speeding-v1" },
    create: {
      slug:        "speeding-v1",
      name:        "Contestação — Excesso de Velocidade",
      caseType:    "SPEEDING",
      description: "Minuta de impugnação de coima por excesso de velocidade",
      bodyText:    "{{generated_by_code}}",
      legalBasis:  ["CE Art.24", "RGCO Art.58", "RGCO Art.68", "DL 291/90", "Portaria 1504/2008"],
      isActive:    true,
      version:     1,
    },
    update: { isActive: true },
  });

  await prisma.legalTemplate.upsert({
    where: { slug: "parking-v1" },
    create: {
      slug:        "parking-v1",
      name:        "Contestação — Estacionamento Proibido",
      caseType:    "PARKING",
      description: "Minuta de impugnação de coima por estacionamento proibido",
      bodyText:    "{{generated_by_code}}",
      legalBasis:  ["CE Art.48", "CE Art.49", "RGCO Art.58", "DL 307/2003"],
      isActive:    true,
      version:     1,
    },
    update: { isActive: true },
  });

  await prisma.legalTemplate.upsert({
    where: { slug: "admin-error-v1" },
    create: {
      slug:        "admin-error-v1",
      name:        "Impugnação — Erro Administrativo",
      caseType:    "ADMIN_ERROR",
      description: "Minuta de impugnação por erro administrativo ou formal",
      bodyText:    "{{generated_by_code}}",
      legalBasis:  ["RGCO Art.58", "RGCO Art.27", "RGCO Art.70", "CRP Art.32"],
      isActive:    true,
      version:     1,
    },
    update: { isActive: true },
  });

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
