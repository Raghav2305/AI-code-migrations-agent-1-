# Technology Stack

## Core Technologies
- **Node.js 18+** - Runtime environment
- **TypeScript** - Primary language for type safety
- **npm** - Package manager

## AI & Agent Framework
- **LangGraph** - Agent orchestration and workflows
- **LangChain** - LLM integration and tooling
- **Gemini API** - Primary LLM provider
- **Anthropic Claude API** - Alternative LLM provider

## Key Dependencies
```json
{
  "dependencies": {
    "@langchain/core": "^0.2.0",
    "@langchain/google-genai": "^0.2.0",
    "@langchain/anthropic": "^0.2.0",
    "langgraph": "^0.0.60",
    "langchain": "^0.2.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.0",
    "fs-extra": "^11.1.0",
    "winston": "^3.11.0",
    "zod": "^3.22.0"
  }
}
```


## Backend API
- **Express.js** - Web framework
- **SQLite** - Optional local database
- **JWT** - Authentication tokens

## Development Tools
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality
- **ts-node** - TypeScript execution
- **nodemon** - Development server

## LangGraph Architecture
```typescript
// Agent workflow example
const workflow = new StateGraph(AgentState)
  .addNode("analyze_repo", analyzeRepoNode)
  .addNode("infer_architecture", inferArchitectureNode)
  .addNode("generate_report", generateReportNode)
  .addEdge("analyze_repo", "infer_architecture")
  .addEdge("infer_architecture", "generate_report");
```

## Agent Patterns
- **Sequential Pipeline** - Step-by-step processing
- **Parallel Processing** - Concurrent analysis
- **Human-in-the-Loop** - Approval workflows
- **Error Handling** - Retry mechanisms and fallbacks

## Scripts
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

## Why This Stack?
- **LangGraph**: Complex agent workflows with state management
- **TypeScript**: Type safety and better development experience
- **Node.js**: Excellent LLM integration and file processing
- **Express**: Simple, flexible web framework
- **Jest**: Zero-config testing with great TypeScript support