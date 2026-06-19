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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: {
          employees: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return NextResponse.json({
    departments: departments.map((department) => ({
      id: department.id,
      name: department.name,
      description: department.description,
      totalEmployees: department._count.employees
    }))
  });
}

export async function POST(request: NextRequest) {
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
    const department = await prisma.department.create({
      data: parsed.data,
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    return NextResponse.json(
      {
        department: {
          id: department.id,
          name: department.name,
          description: department.description,
          totalEmployees: department._count.employees
        },
        message: `${department.name} was added successfully.`
      },
      { status: 201 }
    );
  } catch (error) {
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
      { error: "Unable to create department." },
      { status: 500 }
    );
  }
}
