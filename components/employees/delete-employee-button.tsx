"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function DeleteEmployeeButton({
  employeeId,
  employeeName
}: {
  employeeId: string;
  employeeName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Delete employee ${employeeName}?`);

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const response = await fetch(`/api/employees/${employeeId}`, {
      method: "DELETE"
    });
    const payload = (await response.json()) as {
      error?: string;
      message?: string;
    };

    setDeleting(false);

    if (!response.ok) {
      toast({
        title: "Unable to delete employee",
        description: payload.error ?? "Please try again.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Employee deleted",
      description: payload.message ?? `${employeeName} was deleted.`
    });
    router.refresh();
  }

  return (
    <Button
      disabled={deleting}
      onClick={handleDelete}
      size="icon"
      type="button"
      variant="ghost"
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only">Delete employee</span>
    </Button>
  );
}
