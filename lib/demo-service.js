const { accountForEmail, credentialsAreValid, TOKENS } = require("./demo-auth");
const d = require("./demo-data");
function bodyOf(r) {
  if (r.body && typeof r.body === "object") return r.body;
  try {
    return JSON.parse(r.body || "{}");
  } catch {
    return {};
  }
}
function num(v, f) {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
}
function paginate(items, q) {
  const page = Math.max(1, num(q.page, 1)),
    limit = Math.min(100, Math.max(1, num(q.limit, 20))),
    start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: items.length,
      total_pages: Math.ceil(items.length / limit),
    },
  };
}
function filter(items, q) {
  const skip = new Set([
    "page",
    "limit",
    "sort",
    "order",
    "month",
    "year",
    "path",
    "route",
  ]);
  return items.filter((x) =>
    Object.entries(q).every(
      ([k, v]) =>
        skip.has(k) ||
        v === undefined ||
        String(x[k] ?? "")
          .toLowerCase()
          .includes(String(v).toLowerCase()),
    ),
  );
}
function period(q) {
  const month = num(q.month, 8),
    year = num(q.year, 2026);
  return Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2100
    ? { month, year }
    : { error: "Month must be 1-12 and year must be 2000-2100." };
}
const ok = (data, message, status = 200) => ({
  status,
  body: {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  },
});
const missing = (message) => ({
  status: 404,
  body: { success: false, message },
});
function execute(action, { request, user, params }) {
  const body = bodyOf(request),
    q = request.query || {},
    p = period(q);
  if (
    ["myAttendance", "attendanceSummary", "allAttendance"].includes(action) &&
    p.error
  )
    return { status: 400, body: { success: false, message: p.error } };
  const h = {
    health: () =>
      ok({
        status: "healthy",
        timestamp: "2026-08-27T09:00:00.000Z",
        version: "1.0.0",
      }),
    login: () =>
      credentialsAreValid(body.email, body.password)
        ? ok(
            {
              token: TOKENS[accountForEmail(body.email).role],
              user: accountForEmail(body.email),
            },
            "Login successful",
          )
        : {
            status: 401,
            body: { success: false, message: "Invalid email or password." },
          },
    register: () =>
      ok(
        { id: 5, ...body, password: undefined, is_active: true },
        "User registered successfully",
        201,
      ),
    me: () => ok(user),
    forgotPassword: () =>
      ok(
        undefined,
        "If the email is registered, password reset instructions have been sent.",
      ),
    resetPassword: () => ok(undefined, "Password reset successfully."),
    testEmail: () => ok(undefined, "Test email request accepted."),
    users: () => ok(paginate(filter(d.ACCOUNTS, q), q)),
    avatar: () =>
      ok(
        { profile_pic: "https://placehold.co/256x256/png" },
        "Profile picture updated successfully",
        201,
      ),
    user: () => {
      const x = d.ACCOUNTS.find((x) => x.id === num(params.id));
      return x ? ok(x) : missing("User not found");
    },
    updateUser: () =>
      ok(
        {
          ...d.ACCOUNTS.find((x) => x.id === num(params.id)),
          ...body,
          password: undefined,
        },
        "User updated successfully",
      ),
    deleteUser: () => ok(undefined, "User deactivated successfully"),
    toggleUser: () =>
      ok(
        { id: num(params.id), is_active: false },
        "User status updated successfully",
      ),
    markAttendance: () =>
      ok(
        {
          ...d.attendance[0],
          id: 4,
          employee_id: user.id,
          full_name: user.full_name,
          ...body,
        },
        "Attendance marked successfully",
        201,
      ),
    myAttendance: () =>
      ok(d.attendance.filter((x) => x.employee_id === user.id)),
    attendanceSummary: () =>
      ok({
        employee_id: num(q.employee_id, user.id),
        month: p.month,
        year: p.year,
        present_days: 2,
        absent_days: 0,
        total_work_hours: 16.47,
      }),
    allAttendance: () => ok(paginate(filter(d.attendance, q), q)),
    todayAttendance: () =>
      ok(d.attendance.filter((x) => x.date === "2026-08-04")),
    leaveTypes: () => ok(d.leaveTypes),
    createLeaveType: () =>
      ok({ id: 3, ...body }, "Leave type created successfully", 201),
    myLeaveAllocation: () =>
      ok([
        {
          employee_id: user.id,
          leave_type_id: 1,
          leave_type_name: "Annual leave",
          allocated_days: 20,
          used_days: 5,
          remaining_days: 15,
          year: 2026,
        },
      ]),
    leaveAllocation: () =>
      ok([
        {
          employee_id: num(params.employee_id),
          leave_type_id: 1,
          allocated_days: 20,
          used_days: 5,
          remaining_days: 15,
          year: 2026,
        },
      ]),
    upsertLeaveAllocation: () =>
      ok(
        { id: 1, ...body, year: body.year || 2026 },
        "Leave allocation saved successfully",
      ),
    createLeaveRequest: () =>
      ok(
        {
          ...d.leaveRequests[0],
          id: 2,
          employee_id: user.id,
          ...body,
          status: "pending",
        },
        "Leave request submitted successfully",
        201,
      ),
    myLeaveRequests: () =>
      ok(d.leaveRequests.filter((x) => x.employee_id === user.id)),
    allLeaveRequests: () => ok(paginate(filter(d.leaveRequests, q), q)),
    approveLeave: () =>
      ok(
        {
          ...d.leaveRequests[0],
          id: num(params.id),
          status: "approved",
          reviewed_by: user.id,
        },
        "Leave request approved",
      ),
    rejectLeave: () =>
      ok(
        {
          ...d.leaveRequests[0],
          id: num(params.id),
          status: "rejected",
          rejection_reason: body.reason || null,
          reviewed_by: user.id,
        },
        "Leave request rejected",
      ),
    upsertSalary: () =>
      ok(
        { ...d.salaryStructures[0], ...body },
        "Salary structure saved successfully",
      ),
    salaryStructures: () => ok(d.salaryStructures),
    salaryStructure: () =>
      ok({ ...d.salaryStructures[0], employee_id: num(params.employee_id) }),
    generatePayrun: () =>
      ok(
        { ...d.payruns[0], id: 2, ...body, status: "completed" },
        "Pay run generated successfully",
        201,
      ),
    payruns: () => ok(paginate(filter(d.payruns, q), q)),
    payrunPayslips: () =>
      ok(d.payslips.map((x) => ({ ...x, payrun_id: num(params.id) }))),
    myPayslips: () => ok(d.payslips.filter((x) => x.employee_id === user.id)),
    payslip: () => ok({ ...d.payslips[0], id: num(params.id) }),
    adminDashboard: () =>
      ok({
        total_employees: 4,
        active_employees: 4,
        attendance_today: 2,
        pending_leave_requests: 1,
        latest_payrun: d.payruns[0],
      }),
    employeeDashboard: () =>
      ok({
        attendance_summary: { present_days: 2 },
        leave_balance: 15,
        latest_payslip: d.payslips[0],
        unread_notifications: 1,
      }),
    hrDashboard: () =>
      ok({
        total_employees: 4,
        new_joiners: 1,
        attendance_today: 2,
        pending_leave_requests: 1,
      }),
    payrollDashboard: () =>
      ok({
        total_employees: 4,
        salary_structures: 1,
        latest_payrun: d.payruns[0],
        total_net_pay: "2465250.00",
      }),
    notifications: () =>
      ok(
        paginate(
          d.notifications.filter((x) => x.user_id === user.id),
          q,
        ),
      ),
    readNotification: () =>
      ok(
        { ...d.notifications[0], id: num(params.id), is_read: true },
        "Notification marked as read",
      ),
    readAllNotifications: () =>
      ok(undefined, "All notifications marked as read"),
    settings: () =>
      ok({
        company_name: "EmPay",
        company_email: "hr@empay.example",
        timezone: "Africa/Lagos",
        currency: "NGN",
      }),
    updateSettings: () => ok(body, "Settings updated successfully"),
    dbStats: () =>
      ok({ database_size: "24 MB", active_connections: 3, tables: 12 }),
    search: () => ok(filter(d.ACCOUNTS, { full_name: q.q || q.search || "" })),
    auditLogs: () => ok(paginate(filter(d.auditLogs, q), q)),
  };
  return h[action] ? h[action]() : missing("Operation not found");
}
module.exports = { execute, period };
