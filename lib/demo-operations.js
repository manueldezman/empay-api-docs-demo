const R = {
  admin: ["admin"],
  adminHr: ["hr_officer", "admin"],
  adminHrPayroll: ["hr_officer", "payroll_officer", "admin"],
  adminPayroll: ["payroll_officer", "admin"],
  payroll: ["payroll_officer"],
  any: ["employee", "hr_officer", "payroll_officer", "admin"],
};
const D = [
  ["GET", "/api/health", "health", null],
  ["POST", "/api/auth/register", "register", R.adminHr],
  ["POST", "/api/auth/login", "login", null],
  ["GET", "/api/auth/me", "me", R.any],
  ["POST", "/api/auth/forgot-password", "forgotPassword", null],
  ["POST", "/api/auth/reset-password", "resetPassword", null],
  ["POST", "/api/auth/test-email", "testEmail", R.admin],
  ["GET", "/api/users", "users", R.any],
  ["POST", "/api/users/me/avatar", "avatar", R.any],
  ["GET", "/api/users/:id", "user", R.any],
  ["PUT", "/api/users/:id", "updateUser", R.any],
  ["DELETE", "/api/users/:id", "deleteUser", R.admin],
  ["PATCH", "/api/users/:id/toggle-active", "toggleUser", R.admin],
  ["POST", "/api/attendance/mark", "markAttendance", R.any],
  ["GET", "/api/attendance/my", "myAttendance", R.any],
  ["GET", "/api/attendance/monthly-summary", "attendanceSummary", R.any],
  ["GET", "/api/attendance/all", "allAttendance", R.adminHrPayroll],
  ["GET", "/api/attendance/today", "todayAttendance", R.adminHrPayroll],
  ["GET", "/api/leave/types", "leaveTypes", R.any],
  ["POST", "/api/leave/types", "createLeaveType", R.admin],
  ["GET", "/api/leave/allocation/my", "myLeaveAllocation", R.any],
  ["GET", "/api/leave/allocation/:employee_id", "leaveAllocation", R.adminHr],
  ["POST", "/api/leave/allocation", "upsertLeaveAllocation", R.adminHr],
  ["POST", "/api/leave/request", "createLeaveRequest", R.any],
  ["GET", "/api/leave/requests/my", "myLeaveRequests", R.any],
  ["GET", "/api/leave/requests/all", "allLeaveRequests", R.adminHrPayroll],
  ["PATCH", "/api/leave/requests/:id/approve", "approveLeave", R.payroll],
  ["PATCH", "/api/leave/requests/:id/reject", "rejectLeave", R.payroll],
  ["POST", "/api/payroll/salary-structure", "upsertSalary", R.adminPayroll],
  ["GET", "/api/payroll/salary-structure", "salaryStructures", R.adminPayroll],
  [
    "GET",
    "/api/payroll/salary-structure/:employee_id",
    "salaryStructure",
    R.adminPayroll,
  ],
  ["POST", "/api/payroll/payrun/generate", "generatePayrun", R.payroll],
  ["GET", "/api/payroll/payruns", "payruns", R.adminPayroll],
  [
    "GET",
    "/api/payroll/payruns/:id/payslips",
    "payrunPayslips",
    R.adminPayroll,
  ],
  ["GET", "/api/payroll/payslips/my", "myPayslips", R.any],
  ["GET", "/api/payroll/payslips/:id", "payslip", R.any],
  ["GET", "/api/payroll/payslips/:id/pdf", "payslipPdf", R.any],
  ["GET", "/api/dashboard/admin", "adminDashboard", R.admin],
  ["GET", "/api/dashboard/employee", "employeeDashboard", R.any],
  ["GET", "/api/dashboard/hr", "hrDashboard", R.adminHr],
  ["GET", "/api/dashboard/payroll", "payrollDashboard", R.adminPayroll],
  ["GET", "/api/notifications", "notifications", R.any],
  ["PUT", "/api/notifications/:id/read", "readNotification", R.any],
  ["PUT", "/api/notifications/read-all", "readAllNotifications", R.any],
  ["GET", "/api/settings", "settings", R.any],
  ["PUT", "/api/settings", "updateSettings", R.admin],
  ["GET", "/api/settings/db-stats", "dbStats", R.admin],
  ["GET", "/api/search", "search", R.any],
  ["GET", "/api/admin/audit-logs", "auditLogs", R.admin],
];
function compile(path) {
  const names = [];
  const source = path.replace(
    /:([^/]+)/g,
    (_, name) => (names.push(name), "([^/]+)"),
  );
  return { names, expression: new RegExp(`^${source}/?$`) };
}
const operations = D.map(([method, path, action, roles]) => ({
  method,
  path,
  action,
  roles,
  ...compile(path),
}));
function findOperation(method, path) {
  for (const op of operations) {
    const match = path.match(op.expression);
    if (match && op.method === method)
      return {
        ...op,
        params: Object.fromEntries(
          op.names.map((name, index) => [name, match[index + 1]]),
        ),
      };
  }
  return null;
}
function pathExists(path) {
  return operations.some((op) => op.expression.test(path));
}
module.exports = { findOperation, operations, pathExists };
