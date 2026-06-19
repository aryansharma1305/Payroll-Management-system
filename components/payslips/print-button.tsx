"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button className="gap-2 no-print" onClick={() => window.print()} type="button">
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print / Download PDF
    </Button>
  );
}
