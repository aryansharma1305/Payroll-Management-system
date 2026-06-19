import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { calculatePayroll } from "@/lib/payroll";
import { prisma } from "@/lib/prisma";
import { currentPayrollPeriod } from "@/lib/utils";

export async function POST() {
  await requireAdmin();

  const period = currentPayrollPeriod();
  const activeEmployees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE"
    },
    orderBy: {
      employeeCode: "asc"
    }
  });

  if (!activeEmployees.length) {
    return NextResponse.json(
      { error: "No active employees found for payroll processing." },
      { status: 400 }
    );
  }

  for (const employee of activeEmployees) {
    const payroll = calculatePayroll({
      employeeId: employee.id,
      basicSalary: employee.basicSalary.toNumber(),
      month: period.month,
      year: period.year
    });

    await prisma.payroll.upsert({
      where: {
        employeeId_month_year: {
          employeeId: employee.id,
          month: period.month,
          year: period.year
        }
      },
      update: payroll,
      create: payroll
    });
  }

  return NextResponse.json({
    message: `Processed ${activeEmployees.length} payroll records for ${period.label}.`
  });
}
