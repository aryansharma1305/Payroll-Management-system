import { prisma } from "@/lib/prisma";

export type PayrollBreakdown = {
  employeeId: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  monthlyBasicSalary: number;
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  grossSalary: number;
  pf: number;
  esi: number;
  tds: number;
  totalDeductions: number;
  netSalary: number;
  status: "DRAFT";
  processedAt: Date;
};

export async function calculatePayroll(
  employeeId: string,
  month: number,
  year: number
): Promise<PayrollBreakdown> {
  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId
    }
  });

  if (!employee) {
    throw new Error("Employee not found.");
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: {
        gte: start,
        lt: end
      }
    },
    select: {
      status: true
    }
  });

  const presentCount = attendance.filter(
    (entry) => entry.status === "PRESENT"
  ).length;
  const absentCount = attendance.filter((entry) => entry.status === "ABSENT")
    .length;
  const halfDayCount = attendance.filter(
    (entry) => entry.status === "HALF_DAY"
  ).length;
  const leaveCount = attendance.filter((entry) => entry.status === "LEAVE")
    .length;

  const monthlyBasicSalary = employee.basicSalary.toNumber();
  const presentDays = presentCount + halfDayCount * 0.5;
  const adjustedBasicSalary = round((monthlyBasicSalary / 26) * presentDays);
  const hra = round(adjustedBasicSalary * 0.4);
  const da = round(adjustedBasicSalary * 0.2);
  const ta = 500;
  const grossSalary = round(adjustedBasicSalary + hra + da + ta);
  const pf = round(adjustedBasicSalary * 0.12);
  const esi = grossSalary < 21000 ? round(grossSalary * 0.0175) : 0;
  const tds =
    adjustedBasicSalary > 20833 ? round(adjustedBasicSalary * 0.1) : 0;
  const totalDeductions = round(pf + esi + tds);
  const netSalary = round(grossSalary - totalDeductions);

  return {
    employeeId,
    month,
    year,
    workingDays: 26,
    presentDays,
    absentDays: absentCount,
    halfDays: halfDayCount,
    leaveDays: leaveCount,
    monthlyBasicSalary,
    basicSalary: adjustedBasicSalary,
    hra,
    da,
    ta,
    grossSalary,
    pf,
    esi,
    tds,
    totalDeductions,
    netSalary,
    status: "DRAFT",
    processedAt: new Date()
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
