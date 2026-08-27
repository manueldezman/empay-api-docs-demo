const assert = require("node:assert/strict");
const test = require("node:test");
const handler = require("../lib/demo-handler");
const { ACCOUNTS, DEMO_PASSWORD, TOKENS } = require("../lib/demo-auth");
const { operations } = require("../lib/demo-operations");

function concrete(path) {
  return path.replace(":id", "1").replace(":employee_id", "4");
}
function invoke({
  method = "GET",
  path = "/api/health",
  body,
  query = {},
  token,
  headers = {},
} = {}) {
  const result = {
    status: null,
    body: null,
    headers: {},
    ended: false,
    content: null,
  };
  const response = {
    setHeader(name, value) {
      result.headers[name] = value;
    },
    status(value) {
      result.status = value;
      return response;
    },
    json(value) {
      result.body = value;
      return result;
    },
    end(value) {
      result.ended = true;
      result.content = value;
      return result;
    },
  };
  handler(
    {
      method,
      url: path,
      body,
      query,
      headers: {
        ...headers,
        ...(token && { authorization: `Bearer ${token}` }),
      },
    },
    response,
  );
  return result;
}

test("contract router exposes all 49 operations", () =>
  assert.equal(operations.length, 49));
test("all four accounts can log in and receive verifiable JWTs", () => {
  for (const account of ACCOUNTS) {
    const r = invoke({
      method: "POST",
      path: "/api/auth/login",
      body: { email: account.email, password: DEMO_PASSWORD },
    });
    assert.equal(r.status, 200);
    assert.match(r.body.data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
    assert.equal(r.body.data.user.role, account.role);
  }
});
test("login rejects incorrect credentials", () =>
  assert.equal(
    invoke({
      method: "POST",
      path: "/api/auth/login",
      body: { email: ACCOUNTS[0].email, password: "wrong" },
    }).status,
    401,
  ));
test("protected operations distinguish missing, invalid, and forbidden access", () => {
  assert.equal(invoke({ path: "/api/auth/me" }).status, 401);
  assert.equal(
    invoke({ path: "/api/auth/me", token: "bad.token.value" }).status,
    401,
  );
  assert.equal(
    invoke({ path: "/api/dashboard/admin", token: TOKENS.employee }).status,
    403,
  );
});
test("every operation returns a controlled response for a permitted account", () => {
  for (const op of operations) {
    const token = op.roles ? TOKENS[op.roles[0]] : undefined;
    const response = invoke({
      method: op.method,
      path: concrete(op.path),
      token,
      body: {
        email: ACCOUNTS[0].email,
        password: DEMO_PASSWORD,
        month: 8,
        year: 2026,
      },
    });
    assert.ok(
      [200, 201].includes(response.status),
      `${op.method} ${op.path} returned ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
});

test("Vercel rewrite dispatches every operation through the shared router", () => {
  for (const op of operations) {
    const path = concrete(op.path).replace(/^\/api\//, "");
    const response = invoke({
      method: op.method,
      path: "/api/router",
      query: { path },
      token: op.roles ? TOKENS[op.roles[0]] : undefined,
      body: {
        email: ACCOUNTS[0].email,
        password: DEMO_PASSWORD,
        month: 8,
        year: 2026,
      },
    });
    assert.ok(
      [200, 201].includes(response.status),
      `${op.method} ${op.path} returned ${response.status}`,
    );
  }
});
test("filters and pagination are honored", () => {
  const r = invoke({
    path: "/api/users",
    token: TOKENS.employee,
    query: { department: "Engineering", page: "1", limit: "1" },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.data.length, 1);
  assert.equal(r.body.data.data[0].department, "Engineering");
  assert.equal(r.body.data.pagination.limit, 1);
});
test("month and year validation rejects invalid ranges", () =>
  assert.equal(
    invoke({
      path: "/api/attendance/my",
      token: TOKENS.employee,
      query: { month: "13", year: "2026" },
    }).status,
    400,
  ));
test("write operations do not persist changes", () => {
  invoke({
    method: "PUT",
    path: "/api/users/4",
    token: TOKENS.employee,
    body: { full_name: "Changed name" },
  });
  const r = invoke({ path: "/api/users/4", token: TOKENS.employee });
  assert.equal(r.body.data.full_name, "Ada Okafor");
});
test("payslip download returns a PDF", () => {
  const r = invoke({
    path: "/api/payroll/payslips/1/pdf",
    token: TOKENS.employee,
  });
  assert.equal(r.status, 200);
  assert.equal(r.headers["Content-Type"], "application/pdf");
  assert.match(r.content, /^%PDF/);
});
test("known paths reject unsupported methods and unknown paths return 404", () => {
  assert.equal(invoke({ method: "DELETE", path: "/api/health" }).status, 405);
  assert.equal(invoke({ path: "/api/unknown" }).status, 404);
});
