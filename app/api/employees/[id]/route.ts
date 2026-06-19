import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { deleteEmployeeUser, syncEmployeeUserEmail } from "@/lib/employee-users";
import { parseEmployeePayload } from "@/lib/employees";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await prisma.employee.findUnique({
    where: {
      id: params.id
    },
    include: {
      department: true
    }
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  return NextResponse.json({ employee });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        id: params.id
      },
      select: {
        email: true
      }
    });

    const employee = await prisma.employee.update({
      where: {
        id: params.id
      },
      data: {
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

    await syncEmployeeUserEmail({
      previousEmail: existingEmployee?.email,
      name: employee.name,
      email: employee.email
    });

    return NextResponse.json({
      employee,
      message: `${employee.name} was updated successfully.`
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An employee with this email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to update employee." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const employee = await prisma.employee.delete({
      where: {
        id: params.id
      }
    });

    await deleteEmployeeUser(employee.email);

    return NextResponse.json({
      message: `${employee.name} was deleted successfully.`
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Unable to delete employee." },
      { status: 500 }
    );
  }
}
