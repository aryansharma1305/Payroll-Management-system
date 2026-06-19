"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProcessPayrollButton() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function processPayroll() {
    setIsProcessing(true);
    setMessage("");

    const response = await fetch("/api/payroll/process", {
      method: "POST"
    });
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
    };

    setIsProcessing(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to process payroll.");
      return;
    }

    setMessage(payload.message ?? "Payroll processed.");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <Button
        className="gap-2"
        disabled={isProcessing}
        onClick={processPayroll}
        type="button"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Calculator className="h-4 w-4" aria-hidden="true" />
        )}
        Process current month
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
