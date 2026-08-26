const {
  DEMO_TOKEN,
  DEMO_USER,
  credentialsAreValid,
} = require("../../lib/demo-auth");
const {
  rejectUnsupportedMethod,
  setDemoHeaders,
} = require("../../lib/demo-http");

function requestBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return {};
    }
  }

  return {};
}

module.exports = function handler(request, response) {
  setDemoHeaders(response, ["POST"]);

  if (rejectUnsupportedMethod(request, response, ["POST"])) {
    return;
  }

  const { email, password } = requestBody(request);

  if (!credentialsAreValid(email, password)) {
    return response.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  return response.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token: DEMO_TOKEN,
      user: DEMO_USER,
    },
  });
};
