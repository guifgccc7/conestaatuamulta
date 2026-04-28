import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?redirect=/dashboard");
  }

  const userId = (session.user as { id: string }).id;

  const [user, cases] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionStatus: true,
        subscriptionPeriodEnd: true,
      },
    }),
    prisma.case.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        documents: {
          select: { id: true, status: true, pdfUrl: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  return (
    <>
      <Navbar />
      <DashboardClient
        user={JSON.parse(JSON.stringify(user))}
        cases={JSON.parse(JSON.stringify(cases))}
      />
    </>
  );
}
