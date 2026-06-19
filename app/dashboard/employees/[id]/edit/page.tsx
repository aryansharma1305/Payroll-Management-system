import { notFound } from "next/navigation";

import { EmployeeForm } from "@/components/employees/employee-form";
import { prisma } from "@/lib/prisma";

type EditEmployeePageProps = {
  params: {
    id: string;
  };
};

export default async function EditEmployeePage({
  params
}: EditEmployeePageProps) {
  const employee = await prisma.employee.findUnique({
    where: {
      id: params.id
    }
  });

  if (!employee) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Edit Employee</h1>
        <p className="text-muted-foreground">
          Update payroll profile details for {employee.name}.
        </p>
      </div>
      <EmployeeForm
        employee={{
          id: employee.id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          departmentId: employee.departmentId,
          designation: employee.designation,
          joiningDate: employee.joiningDate.toISOString().slice(0, 10),
          basicSalary: employee.basicSalary.toString(),
          status: employee.status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
        }}
        mode="edit"
      />
    </div>
  );
}
