"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type DepartmentOption = {
  id: string;
  name: string;
};

type EmployeeFormValues = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  joiningDate: string;
  basicSalary: string;
  status: "ACTIVE" | "INACTIVE";
};

type EmployeeFormProps = {
  employee?: EmployeeFormValues;
  mode: "create" | "edit";
};

const emptyEmployee: EmployeeFormValues = {
  name: "",
  email: "",
  phone: "",
  departmentId: "",
  designation: "",
  joiningDate: "",
  basicSalary: "",
  status: "ACTIVE"
};

export function EmployeeForm({ employee, mode }: EmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<EmployeeFormValues>(
    employee ?? emptyEmployee
  );
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchDepartments() {
      setLoadingDepartments(true);

      const response = await fetch("/api/departments");
      const payload = (await response.json()) as {
        departments?: Array<DepartmentOption & { totalEmployees?: number }>;
        error?: string;
      };

      if (!active) {
        return;
      }

      setLoadingDepartments(false);

      if (!response.ok || !payload.departments) {
        toast({
          title: "Unable to load departments",
          description: payload.error ?? "Please refresh the page and try again.",
          variant: "destructive"
        });
        return;
      }

      setDepartments(
        payload.departments.map((department) => ({
          id: department.id,
          name: department.name
        }))
      );
    }

    fetchDepartments();

    return () => {
      active = false;
    };
  }, [toast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const endpoint =
      mode === "edit" && employee?.id
        ? `/api/employees/${employee.id}`
        : "/api/employees";

    const response = await fetch(endpoint, {
      method: mode === "edit" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone,
        departmentId: values.departmentId,
        designation: values.designation,
        joiningDate: values.joiningDate,
        basicSalary: values.basicSalary,
        status: values.status
      })
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
    };

    setSubmitting(false);

    if (!response.ok) {
      toast({
        title: "Unable to save employee",
        description: payload.error ?? "Please check the form and try again.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: mode === "edit" ? "Employee updated" : "Employee added",
      description:
        payload.message ??
        (mode === "edit"
          ? "The employee record was updated."
          : "The employee record was created.")
    });
    router.push("/dashboard/employees");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {mode === "edit" ? "Edit employee details" : "Add employee details"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" id="name">
              <Input
                id="name"
                name="name"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                required
                value={values.name}
              />
            </Field>
            <Field label="Email" id="email">
              <Input
                id="email"
                name="email"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
                required
                type="email"
                value={values.email}
              />
            </Field>
            <Field label="Phone" id="phone">
              <Input
                id="phone"
                name="phone"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    phone: event.target.value
                  }))
                }
                required
                value={values.phone}
              />
            </Field>
            <Field label="Department" id="department">
              <Select
                onValueChange={(departmentId) =>
                  setValues((current) => ({ ...current, departmentId }))
                }
                required
                value={values.departmentId}
              >
                <SelectTrigger disabled={loadingDepartments} id="department">
                  <SelectValue
                    placeholder={
                      loadingDepartments
                        ? "Loading departments..."
                        : "Select department"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Designation" id="designation">
              <Input
                id="designation"
                name="designation"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    designation: event.target.value
                  }))
                }
                required
                value={values.designation}
              />
            </Field>
            <Field label="Joining date" id="joiningDate">
              <Input
                id="joiningDate"
                name="joiningDate"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    joiningDate: event.target.value
                  }))
                }
                required
                type="date"
                value={values.joiningDate}
              />
            </Field>
            <Field label="Basic salary" id="basicSalary">
              <Input
                id="basicSalary"
                min="1"
                name="basicSalary"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    basicSalary: event.target.value
                  }))
                }
                required
                step="0.01"
                type="number"
                value={values.basicSalary}
              />
            </Field>
            {mode === "edit" ? (
              <Field label="Status" id="status">
                <Select
                  onValueChange={(status: "ACTIVE" | "INACTIVE") =>
                    setValues((current) => ({ ...current, status }))
                  }
                  value={values.status}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={() => router.push("/dashboard/employees")}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button className="gap-2" disabled={submitting} type="submit">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              Save employee
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  children
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
