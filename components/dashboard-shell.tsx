"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  Menu,
  Users,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/dashboard/payroll", label: "Payroll", icon: Banknote },
  { href: "/dashboard/payslips", label: "Payslips", icon: FileText }
];

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(new Date()),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/40 lg:hidden",
          mobileOpen ? "block" : "hidden"
        )}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            className="flex items-center gap-2 font-semibold"
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </span>
            Payroll
          </Link>
          <Button
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Open menu</span>
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-normal">
                  {pageTitle}
                </h1>
                <p className="text-sm text-muted-foreground lg:hidden">
                  {today}
                </p>
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground lg:block">{today}</p>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard/employees")) {
    if (pathname.endsWith("/add")) return "Add Employee";
    if (pathname.includes("/edit")) return "Edit Employee";
    return "Employees";
  }
  if (pathname.startsWith("/dashboard/attendance")) return "Attendance";
  if (pathname.startsWith("/dashboard/payroll")) return "Payroll";
  if (pathname.startsWith("/dashboard/payslips")) return "Payslips";
  return "Dashboard";
}
