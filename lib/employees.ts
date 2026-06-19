import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const employeeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(8, "Enter a valid phone number."),
  departmentId: z.string().trim().min(1, "Select a department."),
  designation: z.string().trim().min(2, "Designation is required."),
  joiningDate: z.string().trim().min(1, "Joining date is required."),
  basicSalary: z.coerce.number().positive("Basic salary must be greater than 0."),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export type EmployeePayload = z.infer<typeof employeeSchema>;

export async function generateEmployeeCode() {
  const employees = await prisma.employee.findMany({
    select: {
      employeeCode: true
    }
  });

  const maxCodeNumber = employees.reduce((max, employee) => {
    const codeNumber = Number(employee.employeeCode.replace(/\D/g, ""));
    return Number.isFinite(codeNumber) ? Math.max(max, codeNumber) : max;
  }, 0);

  return `EMP${String(maxCodeNumber + 1).padStart(3, "0")}`;
}

export function parseEmployeePayload(payload: unknown) {
  return employeeSchema.safeParse(payload);
}
