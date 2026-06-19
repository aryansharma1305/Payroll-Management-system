import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { cn, formatDate } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

const attendanceMeta: Record<
  AttendanceStatus,
  {
    short: string;
    label: string;
    className: string;
  }
> = {
  PRESENT: {
    short: "P",
    label: "Present",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800"
  },
  ABSENT: {
    short: "A",
    label: "Absent",
    className: "border-red-200 bg-red-50 text-red-800"
  },
  HALF_DAY: {
    short: "H",
    label: "Half day",
    className: "border-amber-200 bg-amber-50 text-amber-800"
  },
  LEAVE: {
    short: "L",
    label: "Leave",
    className: "border-sky-200 bg-sky-50 text-sky-800"
  }
} as const;

export default async function PortalAttendancePage() {
  const { employee } = await requireEmployeeRecord();
  const period = currentMonthRange();

  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: period.start,
        lt: period.end
      }
    },
    orderBy: {
      date: "asc"
    }
  });

  const attendanceByDay = new Map(
    attendance.map((record) => [
      record.date.getUTCDate(),
      record.status as AttendanceStatus
    ])
  );

  const counts = attendance.reduce<Partial<Record<AttendanceStatus, number>>>(
    (summary, record) => {
      const status = record.status as AttendanceStatus;

      summary[status] = (summary[status] ?? 0) + 1;
      return summary;
    },
    {}
  );

  const days = Array.from({ length: period.daysInMonth }, (_, index) => {
    const day = index + 1;
    const status = attendanceByDay.get(day);
    const date = new Date(Date.UTC(period.year, period.month - 1, day));

    return {
      day,
      date,
      status
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Attendance</h1>
        <p className="text-muted-foreground">
          Your attendance calendar for {monthLabel(period.month, period.year)}.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Present"
          value={counts.PRESENT ?? 0}
          variant="success"
        />
        <SummaryCard
          label="Absent"
          value={counts.ABSENT ?? 0}
          variant="destructive"
        />
        <SummaryCard
          label="Half Day"
          value={counts.HALF_DAY ?? 0}
          variant="warning"
        />
        <SummaryCard label="Leave" value={counts.LEAVE ?? 0} variant="secondary" />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>{monthLabel(period.month, period.year)}</CardTitle>
              <CardDescription>
                Only your own attendance records are visible here.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: days[0]?.date.getUTCDay() ?? 0 }).map(
              (_, index) => (
                <div key={`blank-${index}`} className="aspect-square" />
              )
            )}
            {days.map(({ day, date, status }) => {
              const meta = status ? attendanceMeta[status] : undefined;

              return (
                <div
                  className={cn(
                    "flex aspect-square min-h-16 flex-col items-center justify-center rounded-md border bg-card p-2 text-sm",
                    meta?.className
                  )}
                  key={day}
                  title={formatDate(date)}
                >
                  <span className="font-semibold">{day}</span>
                  <span className="mt-1 text-xs">
                    {meta ? meta.short : "-"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.values(attendanceMeta).map((meta) => (
              <Badge
                className={meta.className}
                key={meta.short}
                variant="outline"
              >
                {meta.short} - {meta.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  variant
}: {
  label: string;
  value: number;
  variant: "success" | "destructive" | "warning" | "secondary";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant={variant}>{value} days</Badge>
      </CardContent>
    </Card>
  );
}
