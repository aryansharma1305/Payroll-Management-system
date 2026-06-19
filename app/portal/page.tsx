import Link from "next/link";
import { CalendarCheck, IndianRupee, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  currentMonthRange,
  monthLabel,
  requireEmployeeRecord
} from "@/lib/portal";
import { formatCurrency } from "@/lib/utils";

export default async function PortalPage() {
  const { employee } = await requireEmployeeRecord();
  const period = currentMonthRange();

  const [attendanceSummary, lastPayslip] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        employeeId: employee.id,
        date: {
          gte: period.start,
          lt: period.end
        }
      },
      _count: {
        status: true
      }
    }),
    prisma.payroll.findFirst({
      where: {
        employeeId: employee.id
      },
      orderBy: [{ year: "desc" }, { month: "desc" }]
    })
  ]);

  const counts = Object.fromEntries(
    attendanceSummary.map((item) => [item.status, item._count.status])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Welcome, {employee.name}
        </h1>
        <p className="text-muted-foreground">
          Your payroll and attendance snapshot for {monthLabel(period.month, period.year)}.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employee
            </CardTitle>
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{employee.employeeCode}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {employee.department.name} · {employee.designation}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Month Attendance
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">P {counts.PRESENT ?? 0}</Badge>
              <Badge variant="destructive">A {counts.ABSENT ?? 0}</Badge>
              <Badge variant="warning">H {counts.HALF_DAY ?? 0}</Badge>
              <Badge variant="secondary">L {counts.LEAVE ?? 0}</Badge>
            </div>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link href="/portal/attendance">View calendar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Payslip Net Pay
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {lastPayslip ? formatCurrency(lastPayslip.netSalary) : "N/A"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lastPayslip
                ? monthLabel(lastPayslip.month, lastPayslip.year)
                : "No payslip available"}
            </p>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link href="/portal/payslips">View payslips</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
