import {
  CalendarCheck,
  FileSpreadsheet,
  IndianRupee,
  type LucideIcon,
  Users
} from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { currentPayrollPeriod, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const period = currentPayrollPeriod();
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const tomorrowStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  );
  const monthSeries = lastSixMonths(period.month, period.year);

  const [
    totalEmployees,
    thisMonthPayrolls,
    presentToday,
    payrollsProcessed,
    payrollChartRecords,
    departments,
    recentPayrolls
  ] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.payroll.findMany({
      where: {
        month: period.month,
        year: period.year
      },
      select: {
        netSalary: true
      }
    }),
    prisma.attendance.count({
      where: {
        status: "PRESENT",
        date: {
          gte: todayStart,
          lt: tomorrowStart
        }
      }
    }),
    prisma.payroll.count({
      where: {
        month: period.month,
        year: period.year
      }
    }),
    prisma.payroll.findMany({
      where: {
        OR: monthSeries.map((item) => ({
          month: item.month,
          year: item.year
        }))
      },
      select: {
        month: true,
        year: true,
        netSalary: true
      }
    }),
    prisma.department.findMany({
      include: {
        _count: {
          select: {
            employees: {
              where: {
                status: "ACTIVE"
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    }),
    prisma.payroll.findMany({
      include: {
        employee: true
      },
      orderBy: [{ processedAt: "desc" }, { year: "desc" }, { month: "desc" }],
      take: 5
    })
  ]);

  const thisMonthPayrollTotal = thisMonthPayrolls.reduce(
    (total, payroll) => total + payroll.netSalary.toNumber(),
    0
  );

  const payrollChartData = monthSeries.map((item) => {
    const netPayroll = payrollChartRecords
      .filter((record) => record.month === item.month && record.year === item.year)
      .reduce((total, record) => total + record.netSalary.toNumber(), 0);

    return {
      month: item.label,
      netPayroll
    };
  });

  const departmentChartData = departments.map((department) => ({
    name: department.name,
    value: department._count.employees
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
        <p className="text-muted-foreground">
          Payroll and attendance summary for {period.label}.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Active employee records"
          icon={Users}
          label="Total Employees"
          value={totalEmployees}
        />
        <MetricCard
          detail="Net payroll for current month"
          icon={IndianRupee}
          label="This Month Payroll"
          value={formatCurrency(thisMonthPayrollTotal)}
        />
        <MetricCard
          detail="Marked present today"
          icon={CalendarCheck}
          label="Present Today"
          value={presentToday}
        />
        <MetricCard
          detail="Current month records"
          icon={FileSpreadsheet}
          label="Payrolls Processed"
          value={payrollsProcessed}
        />
      </section>

      <DashboardCharts
        departmentData={departmentChartData}
        payrollData={payrollChartData}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayrolls.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div className="font-medium">{payroll.employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {payroll.employee.employeeCode}
                      </div>
                    </TableCell>
                    <TableCell>{monthLabel(payroll.month, payroll.year)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payroll.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payroll.status === "PAID" ? "success" : "warning"}
                      >
                        {payroll.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No payroll records have been processed yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function lastSixMonths(currentMonth: number, currentYear: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(currentYear, currentMonth - 6 + index, 1));
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    return {
      month,
      year,
      label: new Intl.DateTimeFormat("en-IN", {
        month: "short"
      }).format(date)
    };
  });
}

function monthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
