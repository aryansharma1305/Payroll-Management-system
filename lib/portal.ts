import { notFound, redirect } from "next/navigation";

import { requireEmployee } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireEmployeeRecord() {
  const user = await requireEmployee();

  if (!user.email) {
    redirect("/login");
  }

  const employee = await prisma.employee.findUnique({
    where: {
      email: user.email
    },
    include: {
      department: true
    }
  });

  if (!employee) {
    notFound();
  }

  return {
    user,
    employee
  };
}

export function monthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function currentMonthRange() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return {
    month,
    year,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
    daysInMonth: new Date(year, month, 0).getDate()
  };
}
