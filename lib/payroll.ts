export type PayrollInput = {
  employeeId: string;
  basicSalary: number;
  month: number;
  year: number;
};

export function calculatePayroll({
  employeeId,
  basicSalary,
  month,
  year
}: PayrollInput) {
  const hra = round(basicSalary * 0.4);
  const da = round(basicSalary * 0.1);
  const ta = 1600;
  const grossSalary = round(basicSalary + hra + da + ta);
  const pf = round(basicSalary * 0.12);
  const esi = grossSalary <= 21000 ? round(grossSalary * 0.0075) : 0;
  const tds = grossSalary > 50000 ? round(grossSalary * 0.05) : 0;
  const totalDeductions = round(pf + esi + tds);
  const netSalary = round(grossSalary - totalDeductions);

  return {
    employeeId,
    month,
    year,
    basicSalary,
    hra,
    da,
    ta,
    grossSalary,
    pf,
    esi,
    tds,
    totalDeductions,
    netSalary,
    status: "DRAFT" as const,
    processedAt: new Date()
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
