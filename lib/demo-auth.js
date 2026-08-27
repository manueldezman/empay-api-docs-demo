const crypto = require("node:crypto");

const DEMO_PASSWORD = "EmpayDemo123!";
const TOKENS = Object.freeze({
  admin:
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJhZG1pbiIsImlzcyI6ImVtcGF5LWRlbW8iLCJhdWQiOiJlbXBheS1hcGkifQ.KWkziz-CXBt1B8uZOUbi-phza74DQ0ubwHJjF2KPWa4PNo3Jz4yR7Pdbzd7LgyNjmqtISz199vDqrhNvyVI3jC38ZXLq27iVMQaoN2Q48CYzCQUfdV1AIANW7nLuYnu0ORDqldjw9Cvd0LixsP7f7IdR2iysZaE-VNRiHZYTBd6-lTMp7l3qikyx4l45gUfw-KesQjbczuJYVs-9Q-4pip9vv2lcMQZBCQRTFHCMoDbTVXWODF3lzaU7GNStpVOEtDJghQonrfAs1XvFz0ncuydOGO5bX_c61I2FiyZKyKASJjcCqg30FnDaTIjQeC1hG1q8jVjyD5xSlKyrtv18gg",
  hr_officer:
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInJvbGUiOiJocl9vZmZpY2VyIiwiaXNzIjoiZW1wYXktZGVtbyIsImF1ZCI6ImVtcGF5LWFwaSJ9.i37Vymg5nIFvyuEfsydyOSGSDyJCMbL7GxXJgAfUakTohtjQon57-nkmXQoPlzRb6rvJdhwEjhizXSF6ypkNC3oaKFZgGlcOg9o11HQbqEao_XllfyZwi5i9bCNDq0rSTTGFSb9OY1q-8l2OvtEOtyPJjIvO7xyiGnIxkWeV9ScFo7Qh_U_DzA0hUauTYUpdlvmSWfLajqFjyp-tiHN7LFgChyRPOCNAvVdLKWygFRVeTiFmAAPlHKvlh6lr8HkRDRjQhkHb870EC8zQN-iazwsKI9NlvpIAfuN6w6ZXGW4Df7eq5zxDurOtqOK1_662Ns7ZGf0om2rNBD0Zk5PLwQ",
  payroll_officer:
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsInJvbGUiOiJwYXlyb2xsX29mZmljZXIiLCJpc3MiOiJlbXBheS1kZW1vIiwiYXVkIjoiZW1wYXktYXBpIn0.CnJUMVPqMgXXUG8QfKA4-5cFVPr2KP2HXV5TQNOGZRt9xJvOfHNSJIKM24iQh1aohnQ1nCOHpZdP_z9fb3LFoKS5d8kCej2dz85WoFn31UOjqEUZE6q0nqEYDuPDyozr8GjX8QAyoOw0ttILWhN0GwYAtyfoHnNS8udYqqCLKI8DKH0TDhS3jr8Y8O-Yh0_1hUxDrz-EVSmu2oIXIAreERW-3S7xjbHist0kv8mP0nej-7qKuIfiDn5g8R2wAQggWzm7JwzhjzvHC82F_8uyz_71wpG9oOdhfyrnnOodvWpVMh6APUj1rjLN87ysA6farRCMvtnr6c9Qatq50GCp8w",
  employee:
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsInJvbGUiOiJlbXBsb3llZSIsImlzcyI6ImVtcGF5LWRlbW8iLCJhdWQiOiJlbXBheS1hcGkifQ.eeZsZ8ubtiGiqnaNKZF0zXgR3hZBEgQ8MQN17l3Z6G9IP4Ku3_yWUaNHeO4GDMbUfsmv-3f9mKv2g8YsqN8aJAgSBQdXdbrUjGIEDPEaoPFolkl28f2V3eH2PyHJAuwgbZ9Tec1OmA-f88d8ELD4Aoe5Gji_q-WDJ3SXcW4l36RiP9ito7AhPRZx9nCgYrqCblACwyMKJfaukLVQR_icGoxJrWxZN1Yufz9sLTJMuy6NjG3oaRhHFNnT9go3ZpHlowkhgGZWajnUCYbpYrCaBFhVO_kyzmvyJ7BOxO7UlAevM2GMBx57Hd106CkCFC84n5Qve4JnbUkuX8PfoYwKng",
});

const ACCOUNTS = Object.freeze(
  [
    [
      1,
      "Amara Okafor",
      "admin@empay.example",
      "admin",
      "Administration",
      "System Administrator",
    ],
    [
      2,
      "Ifeoma Adeyemi",
      "hr@empay.example",
      "hr_officer",
      "Human Resources",
      "HR Officer",
    ],
    [
      3,
      "Tunde Balogun",
      "payroll@empay.example",
      "payroll_officer",
      "Finance",
      "Payroll Officer",
    ],
    [
      4,
      "Ada Okafor",
      "employee@empay.example",
      "employee",
      "Engineering",
      "Software Engineer",
    ],
  ].map(([id, full_name, email, role, department, designation]) =>
    Object.freeze({
      id,
      full_name,
      email,
      role,
      department,
      designation,
      phone: "+234 800 000 0000",
      profile_pic: "https://placehold.co/256x256/png",
      date_joined: "2026-01-15",
      is_active: true,
      created_at: "2026-08-01T09:00:00.000Z",
      updated_at: "2026-08-01T09:00:00.000Z",
    }),
  ),
);

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAquaeaJRbxfBd475XGYJ0
wTsDZsCeQv8a96l21EMlfnz3kUYFaTd7di267RFJZ977uHRVQ7uQxcbZsEXruwCo
8ZgQl7Z65WYBSZTIjDjGknT+GgRzBS0Ss5h4tiLo2A8l1wYepoXPoLxTtannQGAR
X1WH1TaDdAfpuPNsSzPa+MvSTbXwHlWjuCGMPz4anbu7x+IyIksIf/8Vphwca8TG
Zypi4Lr7RiUz27oLFc4xTPpJZQWbx1Obg86ZR1AyqYtx7gv/A94QeeOWnUFGSFDo
N+tqrWZ6d6tcalCpLtFTzV7PCRN3r9zpSJy8v91XHHMdKK2bVnnpXZNXb+pf+NEd
rQIDAQAB
-----END PUBLIC KEY-----`;

function credentialsAreValid(email, password) {
  return (
    password === DEMO_PASSWORD &&
    ACCOUNTS.some((account) => account.email === email)
  );
}
function accountForEmail(email) {
  return ACCOUNTS.find((account) => account.email === email);
}
function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    const metadata = JSON.parse(Buffer.from(header, "base64url"));
    const claims = JSON.parse(Buffer.from(payload, "base64url"));
    if (
      metadata.alg !== "RS256" ||
      claims.iss !== "empay-demo" ||
      claims.aud !== "empay-api"
    )
      return null;
    if (
      !crypto.verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${payload}`),
        PUBLIC_KEY,
        Buffer.from(signature, "base64url"),
      )
    )
      return null;
    return (
      ACCOUNTS.find(
        (account) => account.id === claims.sub && account.role === claims.role,
      ) || null
    );
  } catch {
    return null;
  }
}
function authorizeHeader(authorization) {
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer "))
    return {
      ok: false,
      status: 401,
      message: "Access denied. No token provided.",
    };
  const user = verifyToken(authorization.slice(7));
  return user
    ? { ok: true, user }
    : { ok: false, status: 401, message: "Invalid token." };
}

module.exports = {
  ACCOUNTS,
  DEMO_PASSWORD,
  TOKENS,
  accountForEmail,
  authorizeHeader,
  credentialsAreValid,
};
