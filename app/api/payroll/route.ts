import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { calculatePayroll } from "@/lib/payroll-calculator";
import { prisma } from "@/lib/prisma";

const payrollPeriodSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100)
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = payrollPeriodSchema.safeParse({
    month: request.nextUrl.searchParams.get("month"),
    year: request.nextUrl.searchParams.get("year")
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid month and year are required." },
      { status: 400 }
    );
  }

  const payrolls = await findPayrolls(parsed.data.month, parsed.data.year);

  return NextResponse.json({
    payrolls: serializePayrolls(payrolls)
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = payrollPeriodSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid payroll period." },
      { status: 400 }
    );
  }

  const { month, year } = parsed.data;
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE"
    },
    orderBy: {
      employeeCode: "asc"
    }
  });

  for (const employee of employees) {
    const breakdown = await calculatePayroll(employee.id, month, year);

    await prisma.payroll.upsert({
      where: {
        employeeId_month_year: {
          employeeId: employee.id,
          month,
          year
        }
      },
      update: {
        basicSalary: breakdown.basicSalary,
        hra: breakdown.hra,
        da: breakdown.da,
        ta: breakdown.ta,
        grossSalary: breakdown.grossSalary,
        pf: breakdown.pf,
        esi: breakdown.esi,
        tds: breakdown.tds,
        totalDeductions: breakdown.totalDeductions,
        netSalary: breakdown.netSalary,
        status: "DRAFT",
        processedAt: breakdown.processedAt
      },
      create: {
        employeeId: employee.id,
        month,
        year,
        basicSalary: breakdown.basicSalary,
        hra: breakdown.hra,
        da: breakdown.da,
        ta: breakdown.ta,
        grossSalary: breakdown.grossSalary,
        pf: breakdown.pf,
        esi: breakdown.esi,
        tds: breakdown.tds,
        totalDeductions: breakdown.totalDeductions,
        netSalary: breakdown.netSalary,
        status: "DRAFT",
        processedAt: breakdown.processedAt
      }
    });
  }

  const payrolls = await findPayrolls(month, year);

  return NextResponse.json({
    payrolls: serializePayrolls(payrolls),
    message: `Processed payroll for ${employees.length} employees.`
  });
}

async function findPayrolls(month: number, year: number) {
  return prisma.payroll.findMany({
    where: {
      month,
      year
    },
    include: {
      employee: {
        include: {
          department: true
        }
      }
    },
    orderBy: {
      employee: {
        employeeCode: "asc"
      }
    }
  });
}

function serializePayrolls(
  payrolls: Awaited<ReturnType<typeof findPayrolls>>
) {
  return payrolls.map((payroll) => ({
    id: payroll.id,
    employeeId: payroll.employeeId,
    month: payroll.month,
    year: payroll.year,
    basicSalary: payroll.basicSalary.toNumber(),
    hra: payroll.hra.toNumber(),
    da: payroll.da.toNumber(),
    ta: payroll.ta.toNumber(),
    grossSalary: payroll.grossSalary.toNumber(),
    pf: payroll.pf.toNumber(),
    esi: payroll.esi.toNumber(),
    tds: payroll.tds.toNumber(),
    totalDeductions: payroll.totalDeductions.toNumber(),
    netSalary: payroll.netSalary.toNumber(),
    status: payroll.status,
    processedAt: payroll.processedAt?.toISOString() ?? null,
    employee: {
      id: payroll.employee.id,
      employeeCode: payroll.employee.employeeCode,
      name: payroll.employee.name,
      department: payroll.employee.department.name
    }
  }));
}
