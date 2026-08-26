const { authorizeHeader } = require("../../lib/demo-auth");
const {
  rejectUnauthorized,
  rejectUnsupportedMethod,
  setDemoHeaders,
} = require("../../lib/demo-http");

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

function optionalNumberInRange(value, minimum, maximum, fallback) {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: fallback };
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    return { ok: false };
  }

  return { ok: true, value: number };
}

module.exports = function handler(request, response) {
  setDemoHeaders(response, ["GET"]);

  if (rejectUnsupportedMethod(request, response, ["GET"])) {
    return;
  }

  const authorization = authorizeHeader(request.headers.authorization);
  if (rejectUnauthorized(response, authorization)) {
    return;
  }

  const now = new Date();
  const month = optionalNumberInRange(
    request.query.month,
    1,
    12,
    now.getUTCMonth() + 1,
  );
  const year = optionalNumberInRange(
    request.query.year,
    2000,
    9999,
    now.getUTCFullYear(),
  );

  if (!month.ok || !year.ok) {
    return response.status(400).json({
      success: false,
      message: "Month must be 1-12 and year must be 2000-9999.",
    });
  }

  const data = attendanceTemplates.map((record, index) => {
    const date = `${year.value}-${String(month.value).padStart(2, "0")}-${String(record.day).padStart(2, "0")}`;

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
