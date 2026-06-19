import Link from "next/link";
import { Download, FileText } from "lucide-react";

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
import { monthLabel, requireEmployeeRecord } from "@/lib/portal";
import { formatCurrency } from "@/lib/utils";

export default async function PortalPayslipsPage() {
  const { employee } = await requireEmployeeRecord();

  const payslips = await prisma.payroll.findMany({
    where: {
      employeeId: employee.id
    },
    orderBy: [{ year: "desc" }, { month: "desc" }]
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Payslips</h1>
        <p className="text-muted-foreground">
          View and print your processed payroll statements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>Your Payslips</CardTitle>
              <CardDescription>
                {payslips.length} record{payslips.length === 1 ? "" : "s"} found.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="py-8 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    No payslips are available yet.
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {monthLabel(payslip.month, payslip.year)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.grossSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payslip.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payslip.status === "PAID" ? "success" : "secondary"
                        }
                      >
                        {payslip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          className="gap-2"
                          href={`/portal/payslips/${payslip.id}`}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
