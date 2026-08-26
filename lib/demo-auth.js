const DEMO_EMAIL = "demo@empay.example";
const DEMO_PASSWORD = "EmpayDemo123!";
const DEMO_TOKEN = "empay_portfolio_demo";

const DEMO_USER = Object.freeze({
  id: 1,
  full_name: "Ada Okafor",
  email: DEMO_EMAIL,
  role: "employee",
  department: "Engineering",
  designation: "Software Engineer",
  phone: "+234 800 000 0000",
  profile_pic: "https://cdn.example.com/avatars/ada.jpg",
  date_joined: "2026-01-15",
  is_active: true,
  created_at: "2026-08-01T09:00:00.000Z",
  updated_at: "2026-08-01T09:00:00.000Z",
});

function credentialsAreValid(email, password) {
  return email === DEMO_EMAIL && password === DEMO_PASSWORD;
}

function authorizeHeader(authorization) {
  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return {
      ok: false,
      status: 401,
      message: "Access denied. No token provided.",
    };
  }

  if (authorization.slice("Bearer ".length) !== DEMO_TOKEN) {
    return { ok: false, status: 401, message: "Invalid token." };
  }

  return { ok: true, token: DEMO_TOKEN, user: DEMO_USER };
}

module.exports = {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_TOKEN,
  DEMO_USER,
  authorizeHeader,
  credentialsAreValid,
};
