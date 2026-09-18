import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parse } from "yaml";

const require = createRequire(import.meta.url);
const { findOperation } = require("../lib/demo-operations.js");
const { TOKENS } = require("../lib/demo-auth.js");

const methods = new Set(["get", "post", "put", "patch", "delete"]);
const mainSpec = parse(readFileSync("openapi.yaml", "utf8"));
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

// Credentials are documented as Authorization header parameters, never as
// security schemes, so the reference renders a Headers section without
// printing a default token next to the field.
if (mainSpec.components.securitySchemes) {
  fail(
    "openapi.yaml must not declare securitySchemes; credentials belong in Authorization header parameters.",
  );
}

const roleFromToken = (value) => {
  const payload = value?.replace(/^Bearer\s+/, "").split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
};

const authorizationHeaders = (operation) =>
  (operation.parameters ?? []).filter(
    (parameter) =>
      parameter?.in === "header" && parameter.name === "Authorization",
  );

// Every operation must be runnable from the playground: the prefilled role has
// to satisfy the simulated API, and public operations must stay public.
const samplePath = (path) => path.replace(/\{[^}]+\}/g, "sample");
const prefilledMismatches = [];

for (const { path, method, operation } of operations) {
  const simulated = findOperation(method.toUpperCase(), samplePath(path));
  const headers = authorizationHeaders(operation);

  if (!simulated) {
    fail(`No simulated operation matches ${method.toUpperCase()} ${path}.`);
  }

  if (!simulated.roles) {
    if (headers.length > 0) {
      prefilledMismatches.push(
        `${method.toUpperCase()} ${path} is public but documents an Authorization header`,
      );
    }
    continue;
  }

  if (headers.length !== 1) {
    fail(
      `${method.toUpperCase()} ${path} must document exactly one Authorization header parameter.`,
    );
  }

  const [header] = headers;
  const prefilled = header.schema?.["x-default"];

  if (header.required !== true || !header.description?.trim()) {
    fail(
      `${method.toUpperCase()} ${path} must mark the Authorization header required and describe it.`,
    );
  }

  if (typeof prefilled !== "string" || !prefilled.startsWith("Bearer ")) {
    fail(
      `${method.toUpperCase()} ${path} must prefill a Bearer token in the Authorization header schema.`,
    );
  }

  const role = roleFromToken(prefilled);

  if (!role || !TOKENS[role]) {
    fail(
      `${method.toUpperCase()} ${path} prefills an unknown demo role token.`,
    );
  }

  if (prefilled !== `Bearer ${TOKENS[role]}`) {
    fail(
      `${method.toUpperCase()} ${path} prefills a token that is not the demo ${role} token.`,
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

// Agents follow the origin printed in llms.txt and in each Markdown page's
// "Documentation Index" blockquote, so a retired origin silently breaks
// discovery. Keep every content file pointed at the canonical host.
const canonicalOrigin = "https://empay-sample.mintlify.app";
const originPattern = /https:\/\/empay-sample\.mintlify\.[a-z]+/g;
const originPages = [...portedPages, "README.md", "docs.json"];
const offOriginReferences = originPages.flatMap((page) => {
  const content = readFileSync(page, "utf8");
  return [...new Set(content.match(originPattern) ?? [])]
    .filter((origin) => origin !== canonicalOrigin)
    .map((origin) => `${page}: ${origin}`);
});

if (offOriginReferences.length > 0) {
  fail(
    `Content references a non-canonical origin (expected ${canonicalOrigin}): ${offOriginReferences.join(", ")}.`,
  );
}

console.log(
  `Content checks passed: ${operations.length} operations, ${actualTags.length} tags, ${topTabs.length} tabs.`,
);
