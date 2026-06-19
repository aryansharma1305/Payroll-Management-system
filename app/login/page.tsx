import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/dashboard" : "/portal");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(120deg,#f8fafc_0%,#eef7f4_45%,#fff8ed_100%)] px-4 py-10">
      <Card className="w-full max-w-md rounded-lg border-slate-200 shadow-xl shadow-slate-200/60">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Landmark className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Payroll login</CardTitle>
            <CardDescription>
              Sign in with your payroll credentials.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className="mt-6 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
            Admin: admin@payroll.com / admin123
            <br />
            Employee: aarav.sharma@payroll.com / employee123
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
