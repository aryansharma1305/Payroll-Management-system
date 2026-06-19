import Link from "next/link";
import { Edit, Plus, Search } from "lucide-react";

import { DeleteEmployeeButton } from "@/components/employees/delete-employee-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function EmployeesPage({
  searchParams
}: {
  searchParams?: {
    search?: string;
  };
}) {
  const search = searchParams?.search?.trim() ?? "";
  const employees = await prisma.employee.findMany({
    where: search
      ? {
          OR: [
            { employeeCode: { contains: search } },
            { name: { contains: search } },
            { email: { contains: search } },
            { designation: { contains: search } },
            {
              department: {
                name: { contains: search }
              }
            }
          ]
        }
      : undefined,
    include: {
      department: true
    },
    orderBy: {
      employeeCode: "asc"
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Employees</h1>
          <p className="text-muted-foreground">
            Search, add, edit, and manage employee master records.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/employees/add">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add employee
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-xl">Employee directory</CardTitle>
            <CardDescription>{employees.length} employees found.</CardDescription>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" action="/dashboard/employees">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="pl-9"
                defaultValue={search}
                name="search"
                placeholder="Search code, name, department, designation"
              />
            </div>
            <Button type="submit">Search</Button>
            {search ? (
              <Button asChild type="button" variant="outline">
                <Link href="/dashboard/employees">Clear</Link>
              </Button>
            ) : null}
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length ? (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employeeCode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-xs text-muted-foreground">{employee.email}</div>
                    </TableCell>
                    <TableCell>{employee.department.name}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(employee.basicSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost">
                          <Link href={`/dashboard/employees/${employee.id}/edit`}>
                            <Edit className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Edit employee</span>
                          </Link>
                        </Button>
                        <DeleteEmployeeButton
                          employeeId={employee.id}
                          employeeName={employee.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-32 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    No employees match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
