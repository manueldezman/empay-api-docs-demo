import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parse } from "yaml";

const require = createRequire(import.meta.url);
const { findOperation } = require("../lib/demo-operations.js");

const methods = new Set(["get", "post", "put", "patch", "delete"]);
const mainSpec = parse(readFileSync("openapi.yaml", "utf8"));
const demoSpec = parse(readFileSync("demo-openapi.yaml", "utf8"));
const docsConfig = JSON.parse(readFileSync("docs.json", "utf8"));
const introductionPage = readFileSync("introduction.mdx", "utf8");
const systemOverviewPage = readFileSync("concepts/system-overview.mdx", "utf8");
const changelogPage = readFileSync("changelog.mdx", "utf8");

const fail = (message) => {
  throw new Error(message);
};

const operations = Object.entries(mainSpec.paths).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({ path, method, operation })),
);

if (operations.length !== 49) {
  fail(`Expected 49 operations, found ${operations.length}.`);
}

const missingDescriptions = operations.filter(
  ({ operation }) => !operation.description?.trim(),
);

if (missingDescriptions.length > 0) {
  const names = missingDescriptions.map(
    ({ method, path }) => `${method.toUpperCase()} ${path}`,
  );
  fail(`Operations missing descriptions: ${names.join(", ")}`);
}

const serverUrl = mainSpec.servers?.[0]?.url;
if (serverUrl !== "https://empay-api-docs-demo.vercel.app") {
  fail(`Unexpected main API server URL: ${serverUrl ?? "missing"}.`);
}

if (JSON.stringify(mainSpec).includes("localhost")) {
  fail("The main OpenAPI specification contains a localhost reference.");
}

const errorFields = Object.keys(
  mainSpec.components.schemas.ErrorResponse.properties,
);
if (errorFields.join(",") !== "success,message") {
  fail(`Unexpected shared error fields: ${errorFields.join(", ")}.`);
}

const roleByScheme = new Map([
  ["employeeAuth", "employee"],
  ["hrOfficerAuth", "hr_officer"],
  ["payrollOfficerAuth", "payroll_officer"],
  ["adminAuth", "admin"],
]);

const securitySchemes = mainSpec.components.securitySchemes ?? {};

if (
  Object.keys(securitySchemes).join(",") !== [...roleByScheme.keys()].join(",")
) {
  fail(
    `Expected security schemes ${[...roleByScheme.keys()].join(", ")}; found ${Object.keys(securitySchemes).join(", ") || "none"}.`,
  );
}

for (const [name, role] of roleByScheme) {
  const scheme = securitySchemes[name];

  if (
    scheme.type !== "http" ||
    scheme.scheme !== "bearer" ||
    !scheme["x-default"]
  ) {
    fail(
      `${name} must be an HTTP bearer scheme with x-default so the playground prefills the ${role} token.`,
    );
  }
}

// Every operation must be runnable from the playground: the prefilled role has
// to satisfy the simulated API, and public operations must stay public.
const samplePath = (path) => path.replace(/\{[^}]+\}/g, "sample");
const prefilledMismatches = [];

for (const { path, method, operation } of operations) {
  const requirement = operation.security ?? [];
  const simulated = findOperation(method.toUpperCase(), samplePath(path));

  if (!simulated) {
    fail(`No simulated operation matches ${method.toUpperCase()} ${path}.`);
  }

  if (requirement.length === 0) {
    if (simulated.roles) {
      prefilledMismatches.push(
        `${method.toUpperCase()} ${path} is public but requires ${simulated.roles.join("/")}`,
      );
    }
    continue;
  }

  if (requirement.length !== 1) {
    fail(
      `${method.toUpperCase()} ${path} must reference exactly one security scheme.`,
    );
  }

  const schemeName = Object.keys(requirement[0])[0];
  const role = roleByScheme.get(schemeName);

  if (!role) {
    fail(
      `${method.toUpperCase()} ${path} references unknown scheme ${schemeName}.`,
    );
  }

  if (!simulated.roles?.includes(role)) {
    prefilledMismatches.push(
      `${method.toUpperCase()} ${path} prefills ${role} but the simulated API allows ${simulated.roles?.join("/") ?? "anonymous"}`,
    );
  }
}

if (prefilledMismatches.length > 0) {
  fail(
    `Playground requests would be rejected: ${prefilledMismatches.join("; ")}.`,
  );
}

const expectedTags = [
  "Authentication",
  "Users",
  "Attendance",
  "Leave",
  "Payroll",
  "Dashboard",
  "Notifications",
  "Settings",
  "Search",
  "Audit",
  "Health",
];
const actualTags = (mainSpec.tags ?? []).map(({ name }) => name);

if (actualTags.join(",") !== expectedTags.join(",")) {
  fail(
    `Expected tag order ${expectedTags.join(", ")}; found ${actualTags.join(", ") || "none"}.`,
  );
}

const demoPath = demoSpec.paths?.["/api/attendance/my"]?.get;
if (!demoPath || demoSpec.servers?.[0]?.url !== serverUrl) {
  fail("The attendance demo operation or its deployed server is missing.");
}

const redirects = docsConfig.redirects ?? [];
const retiredPageRedirect = redirects.find(
  ({ source }) => source === "/product-overview",
);

if (retiredPageRedirect?.destination !== "/introduction") {
  fail("/product-overview must redirect to /introduction.");
}

const topTabs = docsConfig.navigation?.tabs ?? [];
const expectedTabs = [
  "Overview",
  "Getting Started",
  "API Reference",
  "Change Logs",
];
const actualTabs = topTabs.map(({ tab }) => tab);

if (actualTabs.join(",") !== expectedTabs.join(",")) {
  fail(
    `Expected navigation tabs ${expectedTabs.join(", ")}; found ${actualTabs.join(", ") || "none"}.`,
  );
}

const tabByName = (name) => topTabs.find(({ tab }) => tab === name);
const groupsOf = (tab) => tab?.pages?.filter((page) => page.group) ?? [];

const expectedStructure = {
  Overview: {
    "Learn About EmPay": ["introduction"],
    "EmPay Architecture": ["concepts/system-overview"],
    "Platform concepts": ["concepts/roles-and-permissions"],
  },
  "Getting Started": {
    Quickstart: ["getting-started"],
    "Core workflows": [
      "guides/request-and-review-leave",
      "guides/generate-payroll",
    ],
    "Test and troubleshoot": ["troubleshooting"],
  },
  "API Reference": {
    "About API": [
      "api-reference/overview",
      "api-reference/openapi-specification",
      "api-reference/rate-limits-and-authentication",
      "api-reference/error-codes",
    ],
    "Interactive demo": ["api-reference/attendance/my"],
    // Generated directly from openapi.yaml, so it must not list operations.
    Endpoints: null,
  },
};

for (const [tabName, expectedGroups] of Object.entries(expectedStructure)) {
  const tab = tabByName(tabName);

  if (groupsOf(tab).length !== Object.keys(expectedGroups).length) {
    fail(
      `${tabName} must contain ${Object.keys(expectedGroups).length} groups.`,
    );
  }

  for (const [groupName, expectedPages] of Object.entries(expectedGroups)) {
    const group = groupsOf(tab).find((page) => page.group === groupName);

    if (!group) {
      fail(`${tabName} must contain the ${groupName} group.`);
    }

    if (expectedPages === null) {
      if (group.openapi !== "openapi.yaml" || group.pages?.length) {
        fail(`${groupName} must be generated from openapi.yaml without pages.`);
      }
      continue;
    }

    const actualPages = group.pages ?? [];

    if (JSON.stringify(actualPages) !== JSON.stringify(expectedPages)) {
      fail(
        `${tabName} > ${groupName} must list ${expectedPages.join(", ")}; found ${actualPages.join(", ") || "none"}.`,
      );
    }
  }
}

const changelogPages = tabByName("Change Logs")?.pages ?? [];
if (JSON.stringify(changelogPages) !== JSON.stringify(["changelog"])) {
  fail("Change Logs must list only the changelog page.");
}

const referencedPages = topTabs.flatMap((tab) =>
  (tab.pages ?? []).flatMap((page) => (page.group ? (page.pages ?? []) : [])),
);

const missingPages = referencedPages.filter(
  (page) => !existsSync(`${page}.mdx`),
);

if (missingPages.length > 0) {
  fail(`Navigation references missing pages: ${missingPages.join(", ")}.`);
}

const overviewLinks = [
  "/concepts/roles-and-permissions",
  "/guides/request-and-review-leave",
  "/guides/generate-payroll",
  "/getting-started",
];

const missingOverviewLinks = overviewLinks.filter(
  (href) => !introductionPage.includes(`href="${href}"`),
);

if (missingOverviewLinks.length > 0) {
  fail(
    `The introduction is missing required links: ${missingOverviewLinks.join(", ")}.`,
  );
}

const architectureAssets = [
  "/images/empay-architecture-light.svg",
  "/images/empay-architecture-dark.svg",
];

if (!architectureAssets.every((asset) => systemOverviewPage.includes(asset))) {
  fail(
    "The system overview must include light and dark architecture diagrams.",
  );
}

const retiredRoutes = [
  "/api/default/",
  "/api/docs-index",
  "/api/mcp",
  "/api/openapi/download",
  "thally.app",
];

const portedPages = [
  "introduction.mdx",
  "concepts/system-overview.mdx",
  "concepts/roles-and-permissions.mdx",
  "guides/request-and-review-leave.mdx",
  "guides/generate-payroll.mdx",
  "troubleshooting.mdx",
  "getting-started.mdx",
  "changelog.mdx",
  "api-reference/overview.mdx",
  "api-reference/openapi-specification.mdx",
  "api-reference/rate-limits-and-authentication.mdx",
  "api-reference/error-codes.mdx",
];

const staleReferences = portedPages.flatMap((page) => {
  const content = readFileSync(page, "utf8");
  return retiredRoutes
    .filter((route) => content.includes(route))
    .map((route) => `${page}: ${route}`);
});

if (staleReferences.length > 0) {
  fail(
    `Pages still reference Thally-only routes: ${staleReferences.join(", ")}.`,
  );
}

if (
  !changelogPage.includes(
    "does not represent releases of the production EmPay API",
  )
) {
  fail("Changelog must retain the documentation-only disclosure.");
}

console.log(
  `Content checks passed: ${operations.length} operations, ${actualTags.length} tags, ${topTabs.length} tabs.`,
);
