# Repository Structure Plan

## Recommended Directory Structure

```
ai-legacy-migration-suite/
├── README.md
├── package.json
├── tsconfig.json
├── .gitignore
├── CLAUDE.md
├── ACTIVITY_LOG.md
├── REPO_STRUCTURE.md
│
├── agents/                           # Core agent implementations
│   ├── shared/                       # Shared utilities and types
│   │   ├── types/                    # TypeScript type definitions
│   │   │   ├── index.ts
│   │   │   ├── agent.types.ts
│   │   │   └── repository.types.ts
│   │   ├── utils/                    # Common utilities
│   │   │   ├── index.ts
│   │   │   ├── file-parser.ts
│   │   │   └── llm-client.ts
│   │   └── constants/                # Shared constants
│   │       └── index.ts
│   │
│   ├── github-repo-analyzer/         # Agent 1
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── analyzer.ts
│   │   │   ├── file-categorizer.ts
│   │   │   └── ui-generator.ts
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── architecture-inference/       # Agent 2
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── inference-engine.ts
│   │   │   ├── pattern-detector.ts
│   │   │   └── stack-analyzer.ts
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── code-flow/                    # Agent 3
│   │   ├── src/
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── risk-assessment/              # Agent 4
│   │   ├── src/
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── migration-strategy/           # Agent 5
│   │   ├── src/
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── stack-upgrade/                # Agent 6
│   │   ├── src/
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── feedback-integrator/          # Agent 7
│   │   ├── src/
│   │   ├── tests/
│   │   └── README.md
│   │
│   └── blueprint-generator/          # Agent 8
│       ├── src/
│       ├── tests/
│       └── README.md
│
├── api/                              # Backend API services
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── index.ts
│   └── tests/
│
├── ui/                               # Shared UI components
│   ├── components/
│   ├── styles/
│   └── utils/
│
├── docs/                             # Documentation
│   ├── architecture.md
│   ├── api-reference.md
│   └── deployment.md
│
└── tests/                            # Integration tests
    ├── e2e/
    └── integration/
```

## Technology Stack Recommendations

### Core Technologies
- **Language**: TypeScript/JavaScript
- **Runtime**: Node.js
- **Package Manager**: npm/yarn
- **Testing**: Jest + Testing Library
- **Linting**: ESLint + Prettier

### Agent Implementation
- **LLM Integration**: Gemini API or Anthropic API
- **File Processing**: Native Node.js fs module
- **HTTP Client**: axios or fetch


### API/Backend
- **Framework**: Express.js or Fastify
- **Database**: Optional (SQLite for caching)
- **Authentication**: JWT tokens

## Implementation Priority

1. **Phase 1**: Core Infrastructure
   - Set up shared types and utilities
   - Implement GitHub Repo Analyzer Agent
   - Create basic API endpoints

2. **Phase 2**: Architecture Analysis
   - Implement Architecture Inference Agent
   - Add basic UI components
   - Enhance API functionality

3. **Phase 3**: Advanced Analysis
   - Code Flow Agent
   - Risk Assessment Agent
   - Integration between agents

4. **Phase 4**: Strategy & Output
   - Migration Strategy Generator
   - Stack Upgrade Agent
   - Blueprint Generator

5. **Phase 5**: Human Integration
   - Feedback Integrator
   - Enhanced UI/UX
   - Documentation