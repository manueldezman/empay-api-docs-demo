function setDemoHeaders(response, methods) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type",
  );
  response.setHeader(
    "Access-Control-Allow-Methods",
    `${methods.join(", ")}, OPTIONS`,
  );
  response.setHeader("Cache-Control", "no-store");
}

function rejectUnsupportedMethod(request, response, allowedMethods) {
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return true;
  }

  if (!allowedMethods.includes(request.method)) {
    response.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
    return true;
  }

  return false;
}

function rejectUnauthorized(response, authorizationResult) {
  if (authorizationResult.ok) {
    return false;
  }

  response.status(authorizationResult.status).json({
    success: false,
    message: authorizationResult.message,
  });
  return true;
}

module.exports = {
  rejectUnauthorized,
  rejectUnsupportedMethod,
  setDemoHeaders,
};
