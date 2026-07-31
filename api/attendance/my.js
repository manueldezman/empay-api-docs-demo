const DEMO_TOKEN = "empay_portfolio_demo";

const attendanceTemplates = [
  {
    day: 1,
    check_in: "09:00:00",
    check_out: "17:00:00",
    accumulated_minutes: 0,
    duration_minutes: 480,
    status: "present",
  },
  {
    day: 2,
    check_in: "09:18:00",
    check_out: "17:06:00",
    accumulated_minutes: 18,
    duration_minutes: 468,
    status: "present",
  },
  {
    day: 3,
    check_in: null,
    check_out: null,
    accumulated_minutes: 0,
    duration_minutes: null,
    status: "on_leave",
  },
];

function numberInRange(value, minimum, maximum, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : fallback;
}

module.exports = function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "GET") {
    return response.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  const authorization = request.headers.authorization;

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return response.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  if (authorization.slice("Bearer ".length) !== DEMO_TOKEN) {
    return response.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }

  const now = new Date();
  const month = numberInRange(
    request.query.month,
    1,
    12,
    now.getUTCMonth() + 1,
  );
  const year = numberInRange(
    request.query.year,
    2000,
    9999,
    now.getUTCFullYear(),
  );

  const data = attendanceTemplates.map((record, index) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(record.day).padStart(2, "0")}`;

    return {
      id: index + 1,
      employee_id: 1,
      date,
      check_in: record.check_in,
      check_out: record.check_out,
      accumulated_minutes: record.accumulated_minutes,
      duration_minutes: record.duration_minutes,
      status: record.status,
      created_at: `${date}T18:00:00.000Z`,
      full_name: "Ada Okafor",
      email: "ada@example.com",
      department: "Engineering",
      designation: "Software Engineer",
      profile_pic: "https://cdn.example.com/avatars/ada.jpg",
    };
  });

  return response.status(200).json({
    success: true,
    message: "Attendance fetched",
    data,
  });
};
