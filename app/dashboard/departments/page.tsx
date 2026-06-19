import { DepartmentManager } from "@/components/departments/department-manager";
import { prisma } from "@/lib/prisma";

export default async function DepartmentsPage() {
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

  return (
    <div className="space-y-6">
      <DepartmentManager
        initialDepartments={departments.map((department) => ({
          id: department.id,
          name: department.name,
          description: department.description,
          totalEmployees: department._count.employees
        }))}
      />
    </div>
  );
}
