const { authorizeHeader } = require("../../lib/demo-auth");
const {
  rejectUnauthorized,
  rejectUnsupportedMethod,
  setDemoHeaders,
} = require("../../lib/demo-http");

module.exports = function handler(request, response) {
  setDemoHeaders(response, ["GET"]);

  if (rejectUnsupportedMethod(request, response, ["GET"])) {
    return;
  }

  const authorization = authorizeHeader(request.headers.authorization);
  if (rejectUnauthorized(response, authorization)) {
    return;
  }

  return response.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    data: authorization.user,
  });
};
