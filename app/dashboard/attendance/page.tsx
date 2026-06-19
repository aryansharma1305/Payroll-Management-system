import { AttendanceGrid } from "@/components/attendance/attendance-grid";
import { prisma } from "@/lib/prisma";
import { currentPayrollPeriod } from "@/lib/utils";

type AttendancePageProps = {
  searchParams?: {
    month?: string;
    year?: string;
  };
};

export default async function AttendancePage({
  searchParams
}: AttendancePageProps) {
  const currentPeriod = currentPayrollPeriod();
  const month = normalizeMonth(searchParams?.month, currentPeriod.month);
  const year = normalizeYear(searchParams?.year, currentPeriod.year);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [employees, attendance] = await Promise.all([
    prisma.employee.findMany({
      where: {
        status: "ACTIVE"
      },
      orderBy: {
        employeeCode: "asc"
      },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        designation: true
      }
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lt: end
        }
      },
      select: {
        id: true,
        employeeId: true,
        date: true,
        status: true
      }
    })
  ]);

  return (
    <AttendanceGrid
      initialAttendance={attendance.map((entry) => ({
        id: entry.id,
        employeeId: entry.employeeId,
        date: entry.date.toISOString().slice(0, 10),
        status:
          entry.status === "PRESENT" ||
          entry.status === "ABSENT" ||
          entry.status === "HALF_DAY" ||
          entry.status === "LEAVE"
            ? entry.status
            : "ABSENT"
      }))}
      initialEmployees={employees}
      initialMonth={month}
      initialYear={year}
    />
  );
}

function normalizeMonth(value: string | undefined, fallback: number) {
  const month = Number(value);

  return Number.isInteger(month) && month >= 1 && month <= 12
    ? month
    : fallback;
}

function normalizeYear(value: string | undefined, fallback: number) {
  const year = Number(value);

  return Number.isInteger(year) && year >= 2000 && year <= 2100
    ? year
    : fallback;
}
