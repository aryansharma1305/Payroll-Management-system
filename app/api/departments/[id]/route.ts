import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const departmentSchema = z.object({
  name: z.string().trim().min(2, "Department name must be at least 2 characters."),
  description: z.string().trim().min(3, "Description must be at least 3 characters.")
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = departmentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid department data." },
      { status: 400 }
    );
  }

  try {
    const department = await prisma.department.update({
      where: {
        id: params.id
      },
      data: parsed.data,
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    return NextResponse.json({
      department: {
        id: department.id,
        name: department.name,
        description: department.description,
        totalEmployees: department._count.employees
      },
      message: `${department.name} was updated successfully.`
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Department not found." },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A department with this name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to update department." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employeeCount = await prisma.employee.count({
    where: {
      departmentId: params.id
    }
  });

  if (employeeCount > 0) {
    return NextResponse.json(
      { error: "Departments with employees cannot be deleted." },
      { status: 409 }
    );
  }

  try {
    const department = await prisma.department.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({
      message: `${department.name} was deleted successfully.`
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Department not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Unable to delete department." },
      { status: 500 }
    );
  }
}
