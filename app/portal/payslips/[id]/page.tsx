import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/payslips/print-button";
import { Button } from "@/components/ui/button";
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
import { monthLabel, requireEmployeeRecord } from "@/lib/portal";
import { formatCurrency } from "@/lib/utils";

type PortalPayslipDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function PortalPayslipDetailPage({
  params
}: PortalPayslipDetailPageProps) {
  const { employee } = await requireEmployeeRecord();

  const payslip = await prisma.payroll.findFirst({
    where: {
      id: params.id,
      employeeId: employee.id
    },
    include: {
      employee: {
        include: {
          department: true
        }
      }
    }
  });

  if (!payslip) {
    notFound();
  }

  const month = monthLabel(payslip.month, payslip.year);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <Button asChild variant="outline">
          <Link className="gap-2" href="/portal/payslips">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to payslips
          </Link>
        </Button>
        <PrintButton />
      </div>

      <Card className="payslip-print-area">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-dashed text-xs font-semibold text-muted-foreground">
                LOGO
              </div>
              <div>
                <CardTitle className="text-2xl">ABC Company Pvt. Ltd.</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Payroll Statement for {month}
                </p>
              </div>
            </div>
            <div className="rounded-md border px-4 py-3 text-sm">
              <div className="text-muted-foreground">Payslip ID</div>
              <div className="font-medium">{payslip.id}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <section>
            <h2 className="mb-4 text-lg font-semibold">Employee Details</h2>
            <div className="grid gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Name" value={payslip.employee.name} />
              <Detail label="Code" value={payslip.employee.employeeCode} />
              <Detail
                label="Department"
                value={payslip.employee.department.name}
              />
              <Detail label="Designation" value={payslip.employee.designation} />
              <Detail label="Month" value={month} />
              <Detail label="Status" value={payslip.status} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-semibold">Earnings</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AmountRow label="Basic" value={payslip.basicSalary} />
                  <AmountRow label="HRA" value={payslip.hra} />
                  <AmountRow label="DA" value={payslip.da} />
                  <AmountRow label="TA" value={payslip.ta} />
                  <TableRow>
                    <TableCell className="font-semibold">Gross Pay</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payslip.grossSalary)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold">Deductions</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AmountRow label="PF" value={payslip.pf} />
                  <AmountRow label="ESI" value={payslip.esi} />
                  <AmountRow label="TDS" value={payslip.tds} />
                  <TableRow>
                    <TableCell className="font-semibold">
                      Total Deductions
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payslip.totalDeductions)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="rounded-md border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
            <div className="text-sm font-medium uppercase tracking-wide">
              Net Pay
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {formatCurrency(payslip.netSalary)}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function AmountRow({
  label,
  value
}: {
  label: string;
  value: { toNumber: () => number } | number;
}) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell className="text-right">{formatCurrency(value)}</TableCell>
    </TableRow>
  );
}
