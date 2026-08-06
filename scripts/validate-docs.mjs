import { readFileSync } from "node:fs";
import { parse } from "yaml";

const methods = new Set(["get", "post", "put", "patch", "delete"]);
const mainSpec = parse(readFileSync("openapi.yaml", "utf8"));
const demoSpec = parse(readFileSync("demo-openapi.yaml", "utf8"));
const docsConfig = JSON.parse(readFileSync("docs.json", "utf8"));
const overviewPage = readFileSync("product-overview.mdx", "utf8");
const changelogPage = readFileSync("changelog.mdx", "utf8");

const operations = Object.entries(mainSpec.paths).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({ path, method, operation })),
);

const visibleOperations = operations.filter(
  ({ path }) => path !== "/api/health",
);
const missingDescriptions = visibleOperations.filter(
  ({ operation }) => !operation.description?.trim(),
);

if (operations.length !== 49) {
  throw new Error(`Expected 49 operations, found ${operations.length}.`);
}

if (visibleOperations.length !== 48) {
  throw new Error(
    `Expected 48 visible operations, found ${visibleOperations.length}.`,
  );
}

if (missingDescriptions.length > 0) {
  const names = missingDescriptions.map(
    ({ method, path }) => `${method.toUpperCase()} ${path}`,
  );
  throw new Error(`Operations missing descriptions: ${names.join(", ")}`);
}

const serverUrl = mainSpec.servers?.[0]?.url;
if (serverUrl !== "https://empay-api-docs-demo.vercel.app") {
  throw new Error(`Unexpected main API server URL: ${serverUrl ?? "missing"}.`);
}

if (JSON.stringify(mainSpec).includes("localhost")) {
  throw new Error(
    "The main OpenAPI specification contains a localhost reference.",
  );
}

const errorFields = Object.keys(
  mainSpec.components.schemas.ErrorResponse.properties,
);
if (errorFields.join(",") !== "success,message") {
  throw new Error(`Unexpected shared error fields: ${errorFields.join(", ")}.`);
}

const demoPath = demoSpec.paths?.["/api/attendance/my"]?.get;
if (!demoPath || demoSpec.servers?.[0]?.url !== serverUrl) {
  throw new Error(
    "The attendance demo operation or its deployed server is missing.",
  );
}

const topTabs = docsConfig.navigation?.tabs ?? [];
const expectedTabs = ["Documentation", "API Reference", "Changelog"];
const actualTabs = topTabs.map(({ tab }) => tab);

if (actualTabs.join(",") !== expectedTabs.join(",")) {
  throw new Error(
    `Expected navigation tabs ${expectedTabs.join(", ")}; found ${actualTabs.join(", ") || "none"}.`,
  );
}

const documentation = topTabs.find(({ tab }) => tab === "Documentation");
const gettingStarted = documentation?.pages?.find(
  ({ group }) => group === "Getting Started",
);

if (
  JSON.stringify(gettingStarted?.pages) !==
  JSON.stringify(["product-overview", "getting-started"])
) {
  throw new Error(
    "Documentation must begin with Overview, then Getting Started.",
  );
}

const apiReference = topTabs.find(({ tab }) => tab === "API Reference");
const moduleGroups = apiReference?.pages?.filter((page) => page.group) ?? [];

if (moduleGroups.length !== 10) {
  throw new Error(
    `Expected 10 API module groups, found ${moduleGroups.length}.`,
  );
}

if (!moduleGroups.every(({ expanded }) => expanded === false)) {
  throw new Error("Every API module group must start collapsed.");
}

const overviewLinks = [
  "/api-reference/auth/register-a-user",
  "/api-reference/attendance/my",
  "/api-reference/leave/submit-a-leave-request",
  "/api-reference/payroll/generate-or-regenerate-a-pay-run",
  "/getting-started",
];

const missingOverviewLinks = overviewLinks.filter(
  (href) => !overviewPage.includes(`href="${href}"`),
);

if (missingOverviewLinks.length > 0) {
  throw new Error(
    `Overview is missing required links: ${missingOverviewLinks.join(", ")}.`,
  );
}

const architectureAssets = [
  "/images/empay-architecture-light.svg",
  "/images/empay-architecture-dark.svg",
];

if (!architectureAssets.every((asset) => overviewPage.includes(asset))) {
  throw new Error(
    "Overview must include light and dark architecture diagrams.",
  );
}

if (
  !changelogPage.includes(
    "does not represent releases of the production EmPay API",
  )
) {
  throw new Error("Changelog must retain the documentation-only disclosure.");
}

console.log(
  `Content checks passed: ${operations.length} operations, ${visibleOperations.length} visible, ${moduleGroups.length} module groups.`,
);
