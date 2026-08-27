const { ACCOUNTS } = require("./demo-auth");

const attendance = [
  {
    id: 1,
    employee_id: 4,
    full_name: "Ada Okafor",
    department: "Engineering",
    date: "2026-08-03",
    check_in: "08:52:00",
    check_out: "17:08:00",
    status: "present",
    work_hours: 8.27,
  },
  {
    id: 2,
    employee_id: 4,
    full_name: "Ada Okafor",
    department: "Engineering",
    date: "2026-08-04",
    check_in: "09:03:00",
    check_out: "17:15:00",
    status: "present",
    work_hours: 8.2,
  },
  {
    id: 3,
    employee_id: 2,
    full_name: "Ifeoma Adeyemi",
    department: "Human Resources",
    date: "2026-08-04",
    check_in: "08:45:00",
    check_out: "17:02:00",
    status: "present",
    work_hours: 8.28,
  },
];
const leaveTypes = [
  { id: 1, name: "Annual leave", default_days: 20 },
  { id: 2, name: "Sick leave", default_days: 10 },
];
const leaveRequests = [
  {
    id: 1,
    employee_id: 4,
    employee_name: "Ada Okafor",
    leave_type_id: 1,
    leave_type_name: "Annual leave",
    start_date: "2026-09-14",
    end_date: "2026-09-18",
    days_requested: 5,
    reason: "Personal time",
    status: "pending",
    created_at: "2026-08-20T10:00:00.000Z",
  },
];
const salaryStructures = [
  {
    id: 1,
    employee_id: 4,
    employee_name: "Ada Okafor",
    basic_salary: "450000.00",
    hra_percent: 40,
    allowances: "50000.00",
    tax_percent: 10,
    pf_percent: 8,
    effective_from: "2026-01-01",
  },
];
const payruns = [
  {
    id: 1,
    month: 7,
    year: 2026,
    status: "completed",
    employee_count: "4",
    total_gross: "2850000.00",
    total_net: "2465250.00",
    created_at: "2026-07-28T12:00:00.000Z",
  },
];
const payslips = [
  {
    id: 1,
    payrun_id: 1,
    employee_id: 4,
    employee_name: "Ada Okafor",
    month: 7,
    year: 2026,
    basic_salary: "450000.00",
    hra: "180000.00",
    allowances: "50000.00",
    gross_salary: "680000.00",
    tax: "68000.00",
    pf_employee: "36000.00",
    other_deductions: "0.00",
    net_salary: "576000.00",
  },
];
const notifications = [
  {
    id: 1,
    user_id: 4,
    title: "Leave request received",
    message: "Your leave request is awaiting review.",
    is_read: false,
    created_at: "2026-08-20T10:01:00.000Z",
  },
];
const auditLogs = [
  {
    id: 1,
    user_id: 1,
    user_name: "Amara Okafor",
    action: "USER_LOGIN",
    entity_type: "user",
    entity_id: 1,
    created_at: "2026-08-27T08:00:00.000Z",
  },
];

module.exports = {
  ACCOUNTS,
  attendance,
  auditLogs,
  leaveRequests,
  leaveTypes,
  notifications,
  payruns,
  payslips,
  salaryStructures,
};
