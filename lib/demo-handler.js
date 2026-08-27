const { authorizeHeader } = require("./demo-auth");
const { findOperation, pathExists } = require("./demo-operations");
const { execute } = require("./demo-service");
const { setDemoHeaders } = require("./demo-http");
function pathOf(r) {
  return new URL(r.url || "/", "https://empay.example").pathname;
}
module.exports = function handler(request, response) {
  setDemoHeaders(response, ["GET", "POST", "PUT", "PATCH", "DELETE"]);
  if (request.method === "OPTIONS") return response.status(204).end();
  const path = pathOf(request),
    op = findOperation(request.method, path);
  if (!op)
    return response.status(pathExists(path) ? 405 : 404).json({
      success: false,
      message: pathExists(path) ? "Method not allowed." : "Endpoint not found.",
    });
  let user = null;
  if (op.roles) {
    const auth = authorizeHeader(request.headers.authorization);
    if (!auth.ok)
      return response
        .status(auth.status)
        .json({ success: false, message: auth.message });
    user = auth.user;
    if (!op.roles.includes(user.role))
      return response.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
  }
  if (op.action === "payslipPdf") {
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="empay-payslip.pdf"',
    );
    return response
      .status(200)
      .end(
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
      );
  }
  const result = execute(op.action, { request, user, params: op.params });
  return response.status(result.status).json(result.body);
};
