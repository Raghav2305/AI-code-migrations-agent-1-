# AI-Assisted Legacy Migration Agent Suite

## Project Overview
A suite of AI agents designed to assist with legacy application migration and modernization.

## Project Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build the project
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking

### Testing
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests

## Project Structure
```
/
├── agents/                     # Individual agent implementations
│   ├── github-repo-analyzer/   # Agent 1: GitHub Repository Analyzer
│   ├── architecture-inference/ # Agent 2: Architecture Inference Agent
│   ├── code-flow/             # Agent 3: Code Flow Agent
│   ├── risk-assessment/       # Agent 4: Risk Assessment Agent
│   └── shared/                # Shared utilities and types
├── web-extension/             # Browser extension for GitHub integration
├── api/                       # Backend API services
├── ui/                        # Frontend UI components
├── docs/                      # Documentation
└── tests/                     # Test files
```

## Current Status
- ✅ GitHub Repo Analyzer Agent - Completed
- 🔄 Architecture Inference Agent - In Progress
- ⏳ Code Flow Agent - Planned
- ⏳ Risk Assessment Agent - Planned
- ⏳ Migration Strategy Generator - Planned
- ⏳ Stack Upgrade Agent - Planned
- ⏳ Human Feedback Integrator - Planned
- ⏳ Blueprint Generator - Planned

## Development Notes
- Use TypeScript for type safety
- Follow existing code patterns and conventions
- Each agent should be modular and testable
- Implement proper error handling and logging