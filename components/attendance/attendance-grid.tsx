"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
};

type AttendanceEntry = {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
};

type AttendanceGridProps = {
  initialEmployees: Employee[];
  initialAttendance: AttendanceEntry[];
  initialMonth: number;
  initialYear: number;
};

const statuses: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "LEAVE"
];

const statusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "P",
  ABSENT: "A",
  HALF_DAY: "H",
  LEAVE: "L"
};

const statusClasses: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ABSENT: "bg-red-100 text-red-800 border-red-200",
  HALF_DAY: "bg-amber-100 text-amber-800 border-amber-200",
  LEAVE: "bg-sky-100 text-sky-800 border-sky-200"
};

export function AttendanceGrid({
  initialEmployees,
  initialAttendance,
  initialMonth,
  initialYear
}: AttendanceGridProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [month, setMonth] = useState(String(initialMonth));
  const [year, setYear] = useState(String(initialYear));
  const [attendance, setAttendance] = useState(initialAttendance);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceEntry>();

    attendance.forEach((entry) => {
      map.set(getCellKey(entry.employeeId, entry.date), entry);
    });

    return map;
  }, [attendance]);

  const daysInMonth = new Date(initialYear, initialMonth, 0).getDate();
  const days = Array.from({ length: 31 }, (_, index) => index + 1);

  function applyPeriod() {
    router.push(`/dashboard/attendance?month=${month}&year=${year}`);
  }

  async function toggleAttendance(employeeId: string, day: number) {
    if (day > daysInMonth) {
      return;
    }

    const date = toDateKey(initialYear, initialMonth, day);
    const cellKey = getCellKey(employeeId, date);
    const currentEntry = attendanceMap.get(cellKey);
    const nextStatus = currentEntry
      ? getNextStatus(currentEntry.status)
      : "PRESENT";

    setUpdatingCell(cellKey);

    const response = await fetch("/api/attendance", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employeeId,
        date,
        status: nextStatus
      })
    });
    const payload = (await response.json()) as {
      attendance?: AttendanceEntry;
      error?: string;
    };

    setUpdatingCell(null);

    if (!response.ok || !payload.attendance) {
      toast({
        title: "Unable to update attendance",
        description: payload.error ?? "Please try again.",
        variant: "destructive"
      });
      return;
    }

    setAttendance((current) => {
      const withoutCell = current.filter(
        (entry) => getCellKey(entry.employeeId, entry.date) !== cellKey
      );
      return [...withoutCell, payload.attendance as AttendanceEntry];
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Attendance</h1>
          <p className="text-muted-foreground">
            Toggle daily attendance for each employee.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[140px_140px_auto]">
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
          <Button onClick={applyPeriod} type="button">
            Apply
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Monthly attendance matrix</CardTitle>
          <CardDescription>
            P = Present, A = Absent, H = Half day, L = Leave. Click any valid
            date cell to cycle the status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-56 bg-card">
                    Employee
                  </TableHead>
                  {days.map((day) => (
                    <TableHead key={day} className="min-w-12 text-center">
                      {day}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-20 text-center">Present</TableHead>
                  <TableHead className="min-w-20 text-center">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialEmployees.map((employee) => {
                  const summary = getEmployeeSummary(
                    employee.id,
                    attendanceMap
                  );

                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="sticky left-0 z-10 bg-card">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.employeeCode} · {employee.designation}
                        </div>
                      </TableCell>
                      {days.map((day) => {
                        const validDay = day <= daysInMonth;
                        const date = toDateKey(initialYear, initialMonth, day);
                        const cellKey = getCellKey(employee.id, date);
                        const entry = attendanceMap.get(cellKey);
                        const status = entry?.status ?? "ABSENT";
                        const updating = updatingCell === cellKey;

                        return (
                          <TableCell key={day} className="p-2 text-center">
                            {validDay ? (
                              <button
                                className={cn(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-semibold transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-70",
                                  statusClasses[status]
                                )}
                                disabled={updating}
                                onClick={() =>
                                  toggleAttendance(employee.id, day)
                                }
                                type="button"
                              >
                                {updating ? (
                                  <Loader2
                                    className="h-3 w-3 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  statusLabels[status]
                                )}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-medium text-emerald-700">
                        {summary.present}
                      </TableCell>
                      <TableCell className="text-center font-medium text-red-700">
                        {summary.absent}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="sticky left-0 z-10 bg-muted font-semibold">
                    Summary
                  </TableCell>
                  <TableCell className="text-muted-foreground" colSpan={31}>
                    Present and absent totals are calculated per employee at the
                    end of each row.
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {initialEmployees.reduce(
                      (total, employee) =>
                        total +
                        getEmployeeSummary(employee.id, attendanceMap).present,
                      0
                    )}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {initialEmployees.reduce(
                      (total, employee) =>
                        total +
                        getEmployeeSummary(employee.id, attendanceMap).absent,
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getNextStatus(status: AttendanceStatus): AttendanceStatus {
  const currentIndex = statuses.indexOf(status);
  return statuses[(currentIndex + 1) % statuses.length];
}

function getEmployeeSummary(
  employeeId: string,
  attendanceMap: Map<string, AttendanceEntry>
) {
  let present = 0;
  let absent = 0;

  attendanceMap.forEach((entry) => {
    if (entry.employeeId !== employeeId) {
      return;
    }

    if (entry.status === "PRESENT") {
      present += 1;
    }

    if (entry.status === "ABSENT") {
      absent += 1;
    }
  });

  return { present, absent };
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function getCellKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}

function yearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
}
