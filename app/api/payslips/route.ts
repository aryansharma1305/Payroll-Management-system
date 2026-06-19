import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let employeeId = request.nextUrl.searchParams.get("employeeId")?.trim();
  const monthParam = request.nextUrl.searchParams.get("month");
  const yearParam = request.nextUrl.searchParams.get("year");
  const month = monthParam ? Number(monthParam) : undefined;
  const year = yearParam ? Number(yearParam) : undefined;

  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
    return NextResponse.json({ error: "Invalid month." }, { status: 400 });
  }

  if (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  if (session.user.role === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({
      where: {
        email: session.user.email ?? ""
      },
      select: {
        id: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee profile not found." },
        { status: 404 }
      );
    }

    employeeId = employee.id;
  }

  const payslips = await prisma.payroll.findMany({
    where: {
      employeeId: employeeId || undefined,
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
    orderBy: [{ year: "desc" }, { month: "desc" }, { employee: { name: "asc" } }]
  });

  return NextResponse.json({
    payslips: payslips.map((payslip) => ({
      id: payslip.id,
      month: payslip.month,
      year: payslip.year,
      grossSalary: payslip.grossSalary.toNumber(),
      totalDeductions: payslip.totalDeductions.toNumber(),
      netSalary: payslip.netSalary.toNumber(),
      status: payslip.status,
      employee: {
        id: payslip.employee.id,
        employeeCode: payslip.employee.employeeCode,
        name: payslip.employee.name,
        department: payslip.employee.department.name,
        designation: payslip.employee.designation
      }
    }))
  });
}
