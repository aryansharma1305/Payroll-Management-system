"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      className="gap-2"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
      variant="outline"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}
