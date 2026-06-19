import Link from "next/link";
import { Eye, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

type PayslipsPageProps = {
  searchParams?: {
    employeeId?: string;
    month?: string;
    year?: string;
  };
};

export default async function PayslipsPage({
  searchParams
}: PayslipsPageProps) {
  const currentPeriod = currentPayrollPeriod();
  const employeeId = searchParams?.employeeId?.trim() ?? "";
  const month = normalizeMonth(searchParams?.month, currentPeriod.month);
  const year = normalizeYear(searchParams?.year, currentPeriod.year);

  const [employees, payslips] = await Promise.all([
    prisma.employee.findMany({
      orderBy: {
        employeeCode: "asc"
      },
      select: {
        id: true,
        employeeCode: true,
        name: true
      }
    }),
    prisma.payroll.findMany({
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
      orderBy: {
        employee: {
          employeeCode: "asc"
        }
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Payslips</h1>
        <p className="text-muted-foreground">
          Filter processed payroll records and open printable payslips.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              Payslip Register
            </CardTitle>
            <CardDescription>
              {payslips.length} records for {monthLabel(month, year)}.
            </CardDescription>
          </div>
          <form
            action="/dashboard/payslips"
            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_150px_130px_auto]"
          >
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={employeeId}
              name="employeeId"
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employeeCode} - {employee.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={String(month)}
              name="month"
            >
              {Array.from({ length: 12 }, (_, index) => {
                const value = index + 1;
                return (
                  <option key={value} value={value}>
                    {new Intl.DateTimeFormat("en-IN", {
                      month: "long"
                    }).format(new Date(Date.UTC(2026, index, 1)))}
                  </option>
                );
              })}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={String(year)}
              name="year"
            >
              {yearOptions().map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardHeader>
        <CardContent>
          {payslips.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div className="font-medium">{payslip.employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {payslip.employee.employeeCode} ·{" "}
                        {payslip.employee.department.name}
                      </div>
                    </TableCell>
                    <TableCell>{monthLabel(payslip.month, payslip.year)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.grossSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payslip.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payslip.status === "PAID" ? "success" : "warning"}
                      >
                        {payslip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          className="gap-2"
                          href={`/dashboard/payslips/${payslip.id}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No processed payroll records match this filter.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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

function monthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function yearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
}
