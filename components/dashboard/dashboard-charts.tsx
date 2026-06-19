"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type PayrollChartItem = {
  month: string;
  netPayroll: number;
};

type DepartmentChartItem = {
  name: string;
  value: number;
};

type DashboardChartsProps = {
  payrollData: PayrollChartItem[];
  departmentData: DepartmentChartItem[];
};

const pieColors = ["#047857", "#0369a1", "#b45309", "#7c3aed", "#be123c"];

export function DashboardCharts({
  payrollData,
  departmentData
}: DashboardChartsProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Last 6 Months Net Payroll</CardTitle>
          <CardDescription>
            Net salary totals from processed payroll records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <BarChart
              data={payrollData}
              height={300}
              margin={{ left: 12, right: 12 }}
              width={720}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="month"
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                tickLine={false}
                width={60}
              />
              <Tooltip
                cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  "Net payroll"
                ]}
              />
              <Bar dataKey="netPayroll" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Employees Per Department</CardTitle>
          <CardDescription>Active employee distribution by team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center overflow-x-auto">
            <PieChart height={260} width={320}>
              <Pie
                cx="50%"
                cy="50%"
                data={departmentData}
                dataKey="value"
                innerRadius={52}
                nameKey="name"
                outerRadius={92}
                paddingAngle={3}
              >
                {departmentData.map((entry, index) => (
                  <Cell
                    fill={pieColors[index % pieColors.length]}
                    key={entry.name}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Employees"]} />
            </PieChart>
          </div>
          <div className="mt-4 grid gap-2">
            {departmentData.map((item, index) => (
              <div
                className="flex items-center justify-between text-sm"
                key={item.name}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: pieColors[index % pieColors.length]
                    }}
                  />
                  {item.name}
                </span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
