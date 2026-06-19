import { EmployeeForm } from "@/components/employees/employee-form";

export default function AddEmployeePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Add Employee</h1>
        <p className="text-muted-foreground">
          Create a new employee record for payroll and attendance tracking.
        </p>
      </div>
      <EmployeeForm mode="create" />
    </div>
  );
}
