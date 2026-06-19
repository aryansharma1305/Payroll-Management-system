import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const departments = [
  {
    name: "Engineering",
    description: "Builds and maintains payroll, employee, and reporting systems."
  },
  {
    name: "HR",
    description: "Manages recruitment, employee records, attendance, and policy operations."
  },
  {
    name: "Finance",
    description: "Handles payroll processing, deductions, reimbursements, and compliance."
  }
];

const employees = [
  {
    employeeCode: "EMP001",
    name: "Aarav Sharma",
    email: "aarav.sharma@payroll.com",
    phone: "9876543210",
    department: "Engineering",
    designation: "Software Engineer",
    joiningDate: "2022-04-11",
    basicSalary: 68000
  },
  {
    employeeCode: "EMP002",
    name: "Ananya Iyer",
    email: "ananya.iyer@payroll.com",
    phone: "9876543211",
    department: "Engineering",
    designation: "Senior Developer",
    joiningDate: "2021-08-16",
    basicSalary: 80000
  },
  {
    employeeCode: "EMP003",
    name: "Rohan Mehta",
    email: "rohan.mehta@payroll.com",
    phone: "9876543212",
    department: "Engineering",
    designation: "QA Analyst",
    joiningDate: "2023-01-09",
    basicSalary: 42000
  },
  {
    employeeCode: "EMP004",
    name: "Priya Nair",
    email: "priya.nair@payroll.com",
    phone: "9876543213",
    department: "HR",
    designation: "HR Executive",
    joiningDate: "2020-11-02",
    basicSalary: 36000
  },
  {
    employeeCode: "EMP005",
    name: "Vikram Singh",
    email: "vikram.singh@payroll.com",
    phone: "9876543214",
    department: "Finance",
    designation: "Accounts Manager",
    joiningDate: "2019-06-24",
    basicSalary: 72000
  },
  {
    employeeCode: "EMP006",
    name: "Neha Gupta",
    email: "neha.gupta@payroll.com",
    phone: "9876543215",
    department: "Finance",
    designation: "Payroll Analyst",
    joiningDate: "2022-09-19",
    basicSalary: 51000
  },
  {
    employeeCode: "EMP007",
    name: "Karthik Rao",
    email: "karthik.rao@payroll.com",
    phone: "9876543216",
    department: "Engineering",
    designation: "DevOps Engineer",
    joiningDate: "2023-07-03",
    basicSalary: 61000
  },
  {
    employeeCode: "EMP008",
    name: "Meera Kulkarni",
    email: "meera.kulkarni@payroll.com",
    phone: "9876543217",
    department: "HR",
    designation: "Talent Partner",
    joiningDate: "2021-12-13",
    basicSalary: 47000
  },
  {
    employeeCode: "EMP009",
    name: "Siddharth Menon",
    email: "siddharth.menon@payroll.com",
    phone: "9876543218",
    department: "Finance",
    designation: "Junior Accountant",
    joiningDate: "2024-02-05",
    basicSalary: 25000
  },
  {
    employeeCode: "EMP010",
    name: "Isha Patel",
    email: "isha.patel@payroll.com",
    phone: "9876543219",
    department: "Engineering",
    designation: "Product Designer",
    joiningDate: "2022-05-30",
    basicSalary: 56000
  }
];

function monthDates(year: number, zeroBasedMonth: number) {
  const daysInMonth = new Date(year, zeroBasedMonth + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return new Date(Date.UTC(year, zeroBasedMonth, day));
  });
}

async function main() {
  const password = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("employee123", 10);

  await prisma.user.upsert({
    where: { email: "admin@payroll.com" },
    update: {
      name: "Payroll Admin",
      password,
      role: "ADMIN"
    },
    create: {
      name: "Payroll Admin",
      email: "admin@payroll.com",
      password,
      role: "ADMIN"
    }
  });

  for (const department of departments) {
    await prisma.department.upsert({
      where: { name: department.name },
      update: department,
      create: department
    });
  }

  const departmentRecords = await prisma.department.findMany();
  const departmentByName = new Map(
    departmentRecords.map((department) => [department.name, department.id])
  );

  for (const employee of employees) {
    const departmentId = departmentByName.get(employee.department);

    if (!departmentId) {
      throw new Error(`Missing department ${employee.department}`);
    }

    await prisma.employee.upsert({
      where: { employeeCode: employee.employeeCode },
      update: {
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        departmentId,
        designation: employee.designation,
        joiningDate: new Date(`${employee.joiningDate}T00:00:00.000Z`),
        basicSalary: employee.basicSalary,
        status: "ACTIVE"
      },
      create: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        departmentId,
        designation: employee.designation,
        joiningDate: new Date(`${employee.joiningDate}T00:00:00.000Z`),
        basicSalary: employee.basicSalary,
        status: "ACTIVE"
      }
    });

    await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        name: employee.name,
        role: "EMPLOYEE"
      },
      create: {
        name: employee.name,
        email: employee.email,
        password: employeePassword,
        role: "EMPLOYEE"
      }
    });
  }

  const employeeRecords = await prisma.employee.findMany({
    orderBy: { employeeCode: "asc" }
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dates = monthDates(year, month);

  for (const employee of employeeRecords) {
    for (const date of dates) {
      const day = date.getUTCDate();
      const status =
        day % 10 === 0 ? "ABSENT" : day % 5 === 0 ? "LEAVE" : "PRESENT";

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date
          }
        },
        update: { status },
        create: {
          employeeId: employee.id,
          date,
          status
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
