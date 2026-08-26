const assert = require("node:assert/strict");
const test = require("node:test");

const login = require("../api/auth/login");
const profile = require("../api/auth/me");
const attendance = require("../api/attendance/my");
const { DEMO_EMAIL, DEMO_PASSWORD, DEMO_TOKEN } = require("../lib/demo-auth");

function invoke(handler, request) {
  const result = {
    status: null,
    body: null,
    headers: {},
    ended: false,
  };
  const response = {
    setHeader(name, value) {
      result.headers[name] = value;
    },
    status(status) {
      result.status = status;
      return response;
    },
    json(body) {
      result.body = body;
      return result;
    },
    end() {
      result.ended = true;
      return result;
    },
  };

  handler(
    {
      body: undefined,
      headers: {},
      method: "GET",
      query: {},
      ...request,
    },
    response,
  );
  return result;
}

test("login returns the shared demo token for the published credentials", () => {
  const response = invoke(login, {
    method: "POST",
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.token, DEMO_TOKEN);
  assert.equal(response.body.data.user.email, DEMO_EMAIL);
});

test("login rejects incorrect credentials", () => {
  const response = invoke(login, {
    method: "POST",
    body: { email: DEMO_EMAIL, password: "wrong" },
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Invalid email or password.");
});

test("all handlers reject unsupported methods", () => {
  for (const [handler, method] of [
    [login, "GET"],
    [profile, "POST"],
    [attendance, "POST"],
  ]) {
    const response = invoke(handler, { method });
    assert.equal(response.status, 405);
    assert.equal(response.body.message, "Method not allowed.");
  }
});

test("protected endpoints distinguish missing and invalid tokens", () => {
  const missing = invoke(profile, { method: "GET" });
  const invalid = invoke(profile, {
    method: "GET",
    headers: { authorization: "Bearer invalid" },
  });

  assert.equal(missing.status, 401);
  assert.equal(missing.body.message, "Access denied. No token provided.");
  assert.equal(invalid.status, 401);
  assert.equal(invalid.body.message, "Invalid token.");
});

test("profile returns the fictional employee for the shared token", () => {
  const response = invoke(profile, {
    method: "GET",
    headers: { authorization: `Bearer ${DEMO_TOKEN}` },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.email, DEMO_EMAIL);
});

test("attendance returns deterministic records for a valid month and year", () => {
  const response = invoke(attendance, {
    method: "GET",
    headers: { authorization: `Bearer ${DEMO_TOKEN}` },
    query: { month: "8", year: "2026" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 3);
  assert.equal(response.body.data[0].date, "2026-08-01");
});

test("attendance rejects out-of-range month and year values", () => {
  for (const query of [
    { month: "13", year: "2026" },
    { month: "8", year: "1999" },
  ]) {
    const response = invoke(attendance, {
      method: "GET",
      headers: { authorization: `Bearer ${DEMO_TOKEN}` },
      query,
    });
    assert.equal(response.status, 400);
    assert.match(response.body.message, /Month must be 1-12/);
  }
});
