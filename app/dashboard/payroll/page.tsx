import { PayrollManager } from "@/components/payroll/payroll-manager";
import { prisma } from "@/lib/prisma";
import { currentPayrollPeriod } from "@/lib/utils";

type PayrollPageProps = {
  searchParams?: {
    month?: string;
    year?: string;
  };
};

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const currentPeriod = currentPayrollPeriod();
  const month = normalizeMonth(searchParams?.month, currentPeriod.month);
  const year = normalizeYear(searchParams?.year, currentPeriod.year);

  const payrolls = await prisma.payroll.findMany({
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

  return (
    <PayrollManager
      initialMonth={month}
      initialPayrolls={payrolls.map((payroll) => ({
        id: payroll.id,
        employeeId: payroll.employeeId,
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.basicSalary.toNumber(),
        grossSalary: payroll.grossSalary.toNumber(),
        totalDeductions: payroll.totalDeductions.toNumber(),
        netSalary: payroll.netSalary.toNumber(),
        status: payroll.status,
        employee: {
          id: payroll.employee.id,
          employeeCode: payroll.employee.employeeCode,
          name: payroll.employee.name,
          department: payroll.employee.department.name
        }
      }))}
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
