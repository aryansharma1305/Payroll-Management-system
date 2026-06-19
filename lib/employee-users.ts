import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const DEFAULT_EMPLOYEE_PASSWORD = "employee123";

export async function upsertEmployeeUser({
  name,
  email,
  password = DEFAULT_EMPLOYEE_PASSWORD
}: {
  name: string;
  email: string;
  password?: string;
}) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: {
      email
    },
    update: {
      name,
      role: "EMPLOYEE"
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: "EMPLOYEE"
    }
  });
}

export async function syncEmployeeUserEmail({
  previousEmail,
  name,
  email
}: {
  previousEmail?: string;
  name: string;
  email: string;
}) {
  if (previousEmail && previousEmail !== email) {
    await prisma.user.deleteMany({
      where: {
        email: previousEmail,
        role: "EMPLOYEE"
      }
    });
  }

  return upsertEmployeeUser({ name, email });
}

export async function deleteEmployeeUser(email: string) {
  await prisma.user.deleteMany({
    where: {
      email,
      role: "EMPLOYEE"
    }
  });
}
