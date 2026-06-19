import Link from "next/link";
import { Banknote, CalendarCheck, FileText, LayoutDashboard } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireEmployeeRecord } from "@/lib/portal";

export default async function PortalLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { employee } = await requireEmployeeRecord();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link className="flex items-center gap-2 font-semibold" href="/portal">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Banknote className="h-5 w-5" aria-hidden="true" />
              </span>
              Employee Portal
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="text-sm">
                <div className="font-medium">{employee.name}</div>
                <div className="text-muted-foreground">{employee.employeeCode}</div>
              </div>
              <SignOutButton />
            </div>
          </div>
          <Separator />
          <nav className="flex gap-2 overflow-x-auto pb-1">
            <Button asChild size="sm" variant="ghost">
              <Link className="gap-2" href="/portal">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Overview
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link className="gap-2" href="/portal/attendance">
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Attendance
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link className="gap-2" href="/portal/payslips">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Payslips
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
