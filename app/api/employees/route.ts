import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { upsertEmployeeUser } from "@/lib/employee-users";
import { generateEmployeeCode, parseEmployeePayload } from "@/lib/employees";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

  const employees = await prisma.employee.findMany({
    where: search
      ? {
          OR: [
            { employeeCode: { contains: search } },
            { name: { contains: search } },
            { email: { contains: search } },
            { designation: { contains: search } },
            {
              department: {
                name: { contains: search }
              }
            }
          ]
        }
      : undefined,
    include: {
      department: true
    },
    orderBy: {
      employeeCode: "asc"
    }
  });

  return NextResponse.json({ employees });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = parseEmployeePayload(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid employee data." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const employee = await prisma.employee.create({
      data: {
        employeeCode: await generateEmployeeCode(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId,
        designation: data.designation,
        joiningDate: new Date(`${data.joiningDate}T00:00:00.000Z`),
        basicSalary: data.basicSalary,
        status: data.status ?? "ACTIVE"
      },
      include: {
        department: true
      }
    });

    await upsertEmployeeUser({
      name: employee.name,
      email: employee.email
    });

    return NextResponse.json(
      {
        employee,
        message: `${employee.name} was added successfully.`
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An employee with this email or code already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create employee." },
      { status: 500 }
    );
  }
}
