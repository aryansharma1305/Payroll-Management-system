"use client";

import { FormEvent, useState } from "react";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type Department = {
  id: string;
  name: string;
  description: string;
  totalEmployees: number;
};

type DepartmentManagerProps = {
  initialDepartments: Department[];
};

const emptyForm = {
  name: "",
  description: ""
};

export function DepartmentManager({
  initialDepartments
}: DepartmentManagerProps) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState(initialDepartments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openAddDialog() {
    setEditingDepartment(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(department: Department) {
    setEditingDepartment(department);
    setForm({
      name: department.name,
      description: department.description
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(department: Department) {
    setDeletingDepartment(department);
    setDeleteOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const endpoint = editingDepartment
      ? `/api/departments/${editingDepartment.id}`
      : "/api/departments";
    const method = editingDepartment ? "PUT" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });
    const payload = (await response.json()) as {
      department?: Department;
      error?: string;
      message?: string;
    };

    setSubmitting(false);

    if (!response.ok || !payload.department) {
      toast({
        title: editingDepartment
          ? "Unable to update department"
          : "Unable to add department",
        description: payload.error ?? "Please check the form and try again.",
        variant: "destructive"
      });
      return;
    }

    setDepartments((current) => {
      if (editingDepartment) {
        return current.map((department) =>
          department.id === payload.department?.id
            ? (payload.department as Department)
            : department
        );
      }

      return [...current, payload.department as Department].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
    setDialogOpen(false);
    toast({
      title: editingDepartment ? "Department updated" : "Department added",
      description: payload.message
    });
  }

  async function handleDelete() {
    if (!deletingDepartment) {
      return;
    }

    setDeleting(true);

    const response = await fetch(`/api/departments/${deletingDepartment.id}`, {
      method: "DELETE"
    });
    const payload = (await response.json()) as {
      error?: string;
      message?: string;
    };

    setDeleting(false);

    if (!response.ok) {
      toast({
        title: "Unable to delete department",
        description: payload.error ?? "Please try again.",
        variant: "destructive"
      });
      return;
    }

    setDepartments((current) =>
      current.filter((department) => department.id !== deletingDepartment.id)
    );
    setDeleteOpen(false);
    toast({
      title: "Department deleted",
      description: payload.message
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Departments</h1>
          <p className="text-muted-foreground">
            Manage teams used for employee and payroll grouping.
          </p>
        </div>
        <Button className="gap-2" onClick={openAddDialog} type="button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Department
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Total Employees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length ? (
              departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.description}</TableCell>
                  <TableCell className="text-right">
                    {department.totalEmployees}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        onClick={() => openEditDialog(department)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit department</span>
                      </Button>
                      <Button
                        onClick={() => openDeleteDialog(department)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete department</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-32 text-center text-muted-foreground"
                  colSpan={4}
                >
                  No departments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Add Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update the department name and description."
                : "Create a new department for employee records."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="department-name">Name</Label>
              <Input
                id="department-name"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                required
                value={form.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department-description">Description</Label>
              <Textarea
                id="department-description"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                required
                value={form.description}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => setDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className="gap-2" disabled={submitting} type="submit">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deletingDepartment?.name}
              </span>
              . Departments with employees cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
