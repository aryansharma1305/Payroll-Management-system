import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]);

const upsertSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: statusSchema
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = Number(request.nextUrl.searchParams.get("month"));
  const year = Number(request.nextUrl.searchParams.get("year"));

  if (!validMonthYear(month, year)) {
    return NextResponse.json(
      { error: "Valid month and year are required." },
      { status: 400 }
    );
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const employeeWhere =
    session.user.role === "EMPLOYEE"
      ? {
          email: session.user.email ?? ""
        }
      : {
          status: "ACTIVE"
        };
  const employee = session.user.role === "EMPLOYEE"
    ? await prisma.employee.findUnique({
        where: {
          email: session.user.email ?? ""
        },
        select: {
          id: true
        }
      })
    : null;

  if (session.user.role === "EMPLOYEE" && !employee) {
    return NextResponse.json(
      { error: "Employee profile not found." },
      { status: 404 }
    );
  }

  const [employees, attendance] = await Promise.all([
    prisma.employee.findMany({
      where: employeeWhere,
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
        employeeId: employee?.id,
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

  return NextResponse.json({
    employees,
    attendance: attendance.map((entry) => ({
      ...entry,
      date: entry.date.toISOString().slice(0, 10)
    }))
  });
}

export async function POST(request: NextRequest) {
  return upsertAttendance(request);
}

export async function PUT(request: NextRequest) {
  return upsertAttendance(request);
}

async function upsertAttendance(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = upsertSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid attendance data." },
      { status: 400 }
    );
  }

  const { employeeId, date, status } = parsed.data;
  const attendanceDate = new Date(`${date}T00:00:00.000Z`);

  const attendance = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: attendanceDate
      }
    },
    update: {
      status
    },
    create: {
      employeeId,
      date: attendanceDate,
      status
    }
  });

  return NextResponse.json({
    attendance: {
      ...attendance,
      date: attendance.date.toISOString().slice(0, 10)
    },
    message: "Attendance updated."
  });
}

function validMonthYear(month: number, year: number) {
  return (
    Number.isInteger(month) &&
    Number.isInteger(year) &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000 &&
    year <= 2100
  );
}
