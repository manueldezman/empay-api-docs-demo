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
├── demo-openapi.yaml            # Specification for the interactive demo
├── getting-started.mdx          # API onboarding guide
├── api-reference/               # Custom API reference pages
├── api/attendance/my.js         # Simulated Vercel API endpoint
├── docs.json                    # Mintlify site and navigation configuration
├── scripts/validate-docs.mjs    # Project-specific content checks
└── .github/workflows/           # Continuous documentation validation
```

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
- Endpoint descriptions and navigation coverage
- Mintlify configuration and broken links
- Formatting with Prettier

GitHub Actions runs the same validation on pushes to `main` and on pull requests.

## Interactive demo

The **Get my attendance records** reference page can send a real HTTP request to the simulated Vercel endpoint. A fixed portfolio token is provided only for this demonstration. The response contains fictional attendance data and does not require access to the original application backend.

## Built with

- OpenAPI 3.1
- Mintlify
- Redocly CLI
- Vercel Functions
- GitHub Actions
- Prettier

## Project status

This repository is a documentation portfolio sample based on the EmPay HRMS API surface. It is not the official production API service.
