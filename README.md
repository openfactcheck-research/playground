# OpenFactCheck Playground

A Blockly-Based Interactive System for Building, Inspecting and Understanding Fact-Checking Pipelines

## Overview

OpenFactCheck Playground is a visual, no-code interface for constructing and understanding fact-checking pipelines. Using Google Blockly's drag-and-drop interface, users can build complex verification workflows by connecting modular components like claim processors, retrievers, language models, and verifiers.

## Features

- **Visual Pipeline Builder** — Drag-and-drop blocks to construct fact-checking workflows
- **Real-time Code Generation** — See the generated pipeline code as you build
- **Live Fact-Checking** — Run pipelines and see verification results instantly
- **Pipeline Templates** — Start with pre-built templates for common verification patterns
- **Dark/Light Theme** — Comfortable viewing in any environment
- **Cloud Authentication** — Secure login via AWS Cognito

## Tech Stack

| Category       | Technology              |
| -------------- | ----------------------- |
| Framework      | Vue 3 (Composition API) |
| Language       | TypeScript 5.9          |
| Styling        | Tailwind CSS 4          |
| Build Tool     | Vite 7                  |
| Visual Editor  | Google Blockly 12       |
| UI Components  | reka-ui                 |
| Authentication | AWS Amplify + Cognito   |
| Infrastructure | OpenTofu (Terraform)    |
| Hosting        | AWS S3 + CloudFront     |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Task](https://taskfile.dev/) (optional, for task runner)
- [OpenTofu](https://opentofu.org/) (for infrastructure deployment)
- [AWS CLI](https://aws.amazon.com/cli/) (for deployment)

## Getting Started

### Clone the repository

```bash
git clone https://github.com/openfactcheck-research/openfactcheck-playground.git
cd openfactcheck-playground
```

### Install dependencies

```bash
pnpm install
```

### Start development server

```bash
task app
```

### Build for production

```bash
pnpm build
# or with Task
task app:build
```

## Available Tasks

This project uses [Task](https://taskfile.dev/) as a task runner. Run `task --list` to see all available tasks.

### Development

| Task                | Description                             |
| ------------------- | --------------------------------------- |
| `task app`          | Start development server                |
| `task app:dev`      | Start development server                |
| `task app:build`    | Type-check and build for production     |
| `task app:preview`  | Preview production build locally        |
| `task app:lint`     | Run ESLint                              |
| `task app:lint:fix` | Run ESLint with auto-fix                |
| `task app:install`  | Install dependencies                    |
| `task app:clean`    | Remove build artifacts and node_modules |

### Infrastructure

| Task                                   | Description                                      |
| -------------------------------------- | ------------------------------------------------ |
| `task deploy:list`                     | List all deployments, environments, and accounts |
| `task deploy:init TARGET=<target>`     | Initialize infrastructure                        |
| `task deploy:plan TARGET=<target>`     | Plan infrastructure changes                      |
| `task deploy:apply TARGET=<target>`    | Apply infrastructure changes                     |
| `task deploy:destroy TARGET=<target>`  | Destroy infrastructure                           |
| `task deploy:validate TARGET=<target>` | Validate infrastructure configuration            |
| `task app:deploy TARGET=<target>`      | Build and deploy to S3 + CloudFront              |

### Infrastucture Workspaces

| Task                                     | Description         |
| ---------------------------------------- | ------------------- |
| `task deploy:workspace:list`             | List all workspaces |
| `task deploy:workspace:select WS=<name>` | Select a workspace  |
| `task deploy:workspace:create WS=<name>` | Create a workspace  |
| `task deploy:workspace:delete WS=<name>` | Delete a workspace  |

### Validation

| Task         | Description                                 |
| ------------ | ------------------------------------------- |
| `task check` | Validate local environment and dependencies |

## Project Structure

```
playground/
├── src/
│   ├── blockly/           # Blockly configuration and custom blocks
│   │   └── blocks/        # Custom block definitions
│   ├── components/        # Vue components
│   │   └── ui/            # Reusable UI components
│   ├── composables/       # Vue composables (useAuth, etc.)
│   ├── data/              # Mock data and templates
│   ├── lib/               # Utility libraries (Amplify, utils)
│   ├── pages/             # Page components (Dashboard, Login, etc.)
│   ├── router/            # Vue Router configuration
│   └── services/          # API services
├── deployments/           # Infrastructure as Code
│   ├── base/              # Core Terraform/OpenTofu configs
│   ├── environments/      # Environment-specific tfvars
│   └── accounts/          # Account-specific backend configs
├── taskfiles/             # Task definitions
└── public/                # Static assets
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_API_URL=http://localhost:8000
```

## Deployment

### Deploy to AWS

1. Initialize infrastructure:

   ```bash
   task deploy:init TARGET=integration
   ```

2. Review planned changes:

   ```bash
   task deploy:plan TARGET=integration
   ```

3. Apply infrastructure:

   ```bash
   task deploy:apply TARGET=integration
   ```

4. Deploy the application:
   ```bash
   task app:deploy TARGET=integration
   ```

### Available Environments

- `devhasan` — Development
- `integration` — Integration testing
- `production` — Production

## Contributing

This is a private repository. Please follow internal contribution guidelines.

## License

Private — All rights reserved.
