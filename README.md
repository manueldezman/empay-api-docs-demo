# EmPay HRMS API Documentation

A docs-as-code portfolio project for the EmPay HRMS REST API. It combines an OpenAPI specification, a Mintlify reference site, an interactive simulated endpoint, and automated documentation validation.

## Live documentation

- [Open the API documentation](https://empay-sample.mintlify.site/getting-started)

The Vercel deployment is a simulated portfolio environment. It does not connect to the EmPay production backend or expose production data.

## What this project demonstrates

- API reference content generated from OpenAPI
- Endpoints organized by product module
- Request parameters, authentication requirements, and response examples
- An interactive attendance endpoint backed by a safe mock API
- Documentation maintained through Git and Markdown/MDX
- Automated OpenAPI, content, link, configuration, and formatting checks

## Repository structure

```text
.
├── openapi.yaml                 # Complete EmPay HRMS API specification
├── introduction.mdx             # Product overview
├── concepts/                    # Architecture and role-based access
├── guides/                      # Task-oriented workflow guides
├── getting-started.mdx          # Quickstart with a prefilled request
├── troubleshooting.mdx          # Failure diagnosis and resolution
├── api-reference/               # Custom API reference pages
├── api/                         # Simulated Vercel API endpoints
├── docs.json                    # Mintlify site and navigation configuration
├── scripts/validate-docs.mjs    # Project-specific content checks
└── .github/workflows/           # Continuous documentation validation
```

The site is organized into four tabs:

- **Overview** — product introduction, architecture, and roles and permissions.
- **Getting Started** — quickstart and the leave and payroll workflows.
- **API Reference** — API fundamentals plus an operation reference generated
  from `openapi.yaml` tags, and an interactive attendance demonstration.
- **Change Logs** — documentation updates.

## Run locally

Requirements:

- Node.js 20.17 or later
- npm

Install the dependencies:

```bash
npm ci
```

Start the Mintlify development server:

```bash
npx mint dev
```

## Validate the documentation

Run the complete validation suite:

```bash
npm run validate
```

This command checks:

- OpenAPI validity with Redocly
- Endpoint descriptions, tag order, navigation coverage, and that every
  operation's prefilled playground token is authorized by the simulated API
- Mintlify configuration and broken links
- Formatting with Prettier

GitHub Actions runs the same validation on pushes to `main` and on pull requests.

## Interactive demo

Every operation in the reference opens an interactive request builder that sends
real HTTP requests to the simulated Vercel endpoint. Each operation prefills the
demonstration bearer token whose role the operation accepts, so requests are
authorized without copying credentials by hand, and request bodies and query
parameters are prefilled from the specification examples.

The **Get monthly attendance** reference page works the same way. All responses
contain fictional data and do not depend on the original application backend.

## Built with

- OpenAPI 3.1
- Mintlify
- Redocly CLI
- Vercel Functions
- GitHub Actions
- Prettier

## Project status

This repository is a documentation portfolio sample based on the EmPay HRMS API surface. It is not the official production API service.
