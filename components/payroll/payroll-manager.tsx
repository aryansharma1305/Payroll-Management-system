"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

type PayrollRecord = {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  employee: {
    id: string;
    employeeCode: string;
    name: string;
    department: string;
  };
};

type PayrollManagerProps = {
  initialPayrolls: PayrollRecord[];
  initialMonth: number;
  initialYear: number;
};

export function PayrollManager({
  initialPayrolls,
  initialMonth,
  initialYear
}: PayrollManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [month, setMonth] = useState(String(initialMonth));
  const [year, setYear] = useState(String(initialYear));
  const [payrolls, setPayrolls] = useState(initialPayrolls);
  const [processing, setProcessing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  function applyPeriod() {
    router.push(`/dashboard/payroll?month=${month}&year=${year}`);
  }

  async function processPayroll() {
    setProcessing(true);

    const response = await fetch("/api/payroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        month: Number(month),
        year: Number(year)
      })
    });
    const payload = (await response.json()) as {
      payrolls?: PayrollRecord[];
      message?: string;
      error?: string;
    };

    setProcessing(false);

    if (!response.ok || !payload.payrolls) {
      toast({
        title: "Unable to process payroll",
        description: payload.error ?? "Please try again.",
        variant: "destructive"
      });
      return;
    }

    setPayrolls(payload.payrolls);
    toast({
      title: "Payroll processed",
      description: payload.message ?? "Payroll records were generated."
    });
    router.refresh();
  }

  async function markAsPaid(payrollId: string) {
    setPayingId(payrollId);

    const response = await fetch(`/api/payroll/${payrollId}`, {
      method: "PUT"
    });
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
    };

    setPayingId(null);

    if (!response.ok) {
      toast({
        title: "Unable to mark as paid",
        description: payload.error ?? "Please try again.",
        variant: "destructive"
      });
      return;
    }

    setPayrolls((current) =>
      current.map((payroll) =>
        payroll.id === payrollId ? { ...payroll, status: "PAID" } : payroll
      )
    );
    toast({
      title: "Payroll marked as paid",
      description: payload.message ?? "Payroll status was updated."
    });
    router.refresh();
  }

  const totals = payrolls.reduce(
    (accumulator, payroll) => {
      accumulator.gross += payroll.grossSalary;
      accumulator.deductions += payroll.totalDeductions;
      accumulator.net += payroll.netSalary;
      return accumulator;
    },
    { gross: 0, deductions: 0, net: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Payroll</h1>
          <p className="text-muted-foreground">
            Process payroll from attendance for the selected period.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[140px_140px_auto_auto]">
          <Select onValueChange={setMonth} value={month}>
            <SelectTrigger aria-label="Month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, index) => {
                const value = String(index + 1);
                return (
                  <SelectItem key={value} value={value}>
                    {new Intl.DateTimeFormat("en-IN", {
                      month: "long"
                    }).format(new Date(2026, index, 1))}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select onValueChange={setYear} value={year}>
            <SelectTrigger aria-label="Year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions().map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applyPeriod} type="button" variant="outline">
            Apply
          </Button>
          <Button
            className="gap-2"
            disabled={processing}
            onClick={processPayroll}
            type="button"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
            )}
            Process Payroll
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Gross" value={formatCurrency(totals.gross)} />
        <Metric label="Deductions" value={formatCurrency(totals.deductions)} />
        <Metric label="Net Pay" value={formatCurrency(totals.net)} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Payroll results</CardTitle>
          <CardDescription>
            {payrolls.length
              ? `${payrolls.length} payroll records found.`
              : "No payroll has been processed for this period."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrolls.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div className="font-medium">{payroll.employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {payroll.employee.employeeCode} ·{" "}
                        {payroll.employee.department}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payroll.basicSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payroll.grossSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payroll.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payroll.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payroll.status === "PAID" ? "success" : "warning"}
                      >
                        {payroll.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        className="gap-2"
                        disabled={payroll.status === "PAID" || payingId === payroll.id}
                        onClick={() => markAsPaid(payroll.id)}
                        size="sm"
                        type="button"
                        variant={payroll.status === "PAID" ? "outline" : "default"}
                      >
                        {payingId === payroll.id ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        Mark as Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Select a period and process payroll to generate records.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function yearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
}
