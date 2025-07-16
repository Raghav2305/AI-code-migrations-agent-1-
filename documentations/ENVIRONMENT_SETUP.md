# Environment Setup Guide

## Prerequisites

### System Requirements
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 or **yarn** >= 1.22.0
- **Git** >= 2.30.0
- **Modern Browser** (Chrome/Firefox/Edge for extension development)

### Development Tools
- **VSCode** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - REST Client (for API testing)
  - Chrome Extension Development Tools

## Installation Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd ai-legacy-migration-suite
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```bash
# LLM API Configuration
GOOGLE_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# LangGraph Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=ai-legacy-migration

# Development Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# GitHub Integration (optional)
GITHUB_TOKEN=your_github_personal_access_token

# Database (if using)
DATABASE_URL=sqlite:./data/app.db

# Security
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
```

### 4. Create Required Directories
```bash
mkdir -p data logs temp
```

### 5. Development Setup
```bash
# Install development dependencies
npm install --save-dev

# Set up Git hooks (optional)
npx husky install
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GOOGLE_API_KEY` | Gemini API key for LLM integration | Yes | - |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative) | No | - |
| `LANGCHAIN_TRACING_V2` | Enable LangChain tracing | No | false |
| `LANGCHAIN_API_KEY` | LangSmith API key for debugging | No | - |
| `LANGCHAIN_PROJECT` | LangSmith project name | No | ai-legacy-migration |
| `NODE_ENV` | Environment mode | No | development |
| `PORT` | Server port | No | 3000 |
| `LOG_LEVEL` | Logging verbosity | No | info |
| `GITHUB_TOKEN` | GitHub API access token | No | - |
| `DATABASE_URL` | Database connection string | No | sqlite:./data/app.db |
| `JWT_SECRET` | JWT signing secret | No | random |
| `CORS_ORIGIN` | CORS allowed origin | No | * |

## Directory Structure After Setup

```
ai-legacy-migration-suite/
├── .env                    # Environment variables (create this)
├── .env.example           # Environment template
├── data/                  # Database and cache files
├── logs/                  # Application logs
├── temp/                  # Temporary files
├── node_modules/          # Dependencies
└── ...                    # Other project files
```

## Verification

### 1. Check Node.js Version
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 8.0.0
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Run Tests
```bash
npm test
```

### 4. Check Linting
```bash
npm run lint
```

## Troubleshooting

### Common Issues

**1. Node.js Version Mismatch**
```bash
# Use nvm to manage Node versions
nvm install 18
nvm use 18
```

**2. Permission Issues**
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

**3. API Key Issues**
- Ensure `.env` file is in root directory
- Check API key format and permissions
- Verify network connectivity

**4. Port Already in Use**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

## Security Notes

- Never commit `.env` file to version control
- Use strong, unique API keys
- Rotate API keys regularly
- Implement rate limiting for production
- Use HTTPS in production environments

## Next Steps

After environment setup:
1. Read `TECH_STACK.md` for technology details
2. Review `REPO_STRUCTURE.md` for project organization
3. Start with Agent 1 implementation
4. Run tests frequently during development