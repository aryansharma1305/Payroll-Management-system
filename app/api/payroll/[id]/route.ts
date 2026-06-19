import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payroll = await prisma.payroll.update({
    where: {
      id: params.id
    },
    data: {
      status: "PAID",
      processedAt: new Date()
    },
    include: {
      employee: true
    }
  });

  return NextResponse.json({
    payroll: {
      id: payroll.id,
      status: payroll.status,
      processedAt: payroll.processedAt?.toISOString() ?? null
    },
    message: `${payroll.employee.name}'s payroll was marked as paid.`
  });
}
