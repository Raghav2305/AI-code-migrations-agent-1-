# AI Legacy Migration Agent Suite

A comprehensive system for analyzing GitHub repositories and inferring architecture patterns to assist with legacy application modernization.

## 🚀 Features

### Agent 1: GitHub Repository Analyzer
- **Repository Analysis**: Fetches repository metadata via GitHub API
- **File Categorization**: Automatically categorizes files (source, config, docs, tests, etc.)
- **Content Analysis**: Analyzes key file contents for deeper insights
- **AI-Powered Summary**: Uses Gemini API to generate repository purpose and complexity assessment

### Agent 2: Architecture Inference
- **Pattern Detection**: Identifies MVC, Layered, Microservices, and Component-based patterns
- **Tech Stack Analysis**: Extracts technology stack from dependency files
- **Component Identification**: Maps application components and their relationships
- **Entry Point Detection**: Identifies main application entry points
- **Modernization Recommendations**: Provides AI-powered migration suggestions

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **AI Framework**: LangGraph + LangChain
- **Primary LLM**: Gemini API
- **Fallback LLM**: Anthropic Claude API
- **API Framework**: Express.js
- **Testing**: Jest
- **Code Quality**: ESLint + Prettier

## 📋 Prerequisites

- Node.js 18+ and npm
- Gemini API key (Google AI Studio)
- Optional: GitHub Personal Access Token for higher rate limits

## 🔧 Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd ai-legacy-migration-suite
npm install
```

2. **Set up environment variables**:
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your API keys
GOOGLE_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here  # Optional
```

3. **Build the project**:
```bash
npm run build
```

## 🚦 Usage

### Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### Web Interface
Open your browser to `http://localhost:3000` to use the interactive UI.

### API Endpoints

#### Start Analysis
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl": "https://github.com/user/repo"}'
```

#### Get Analysis Results
```bash
curl http://localhost:3000/api/analysis/{analysisId}
```

#### Real-time Updates
```bash
curl http://localhost:3000/api/analysis/{analysisId}/stream
```

## 📊 Example Analysis Output

```json
{
  "repositoryAnalysis": {
    "repository": {
      "name": "example-repo",
      "description": "A sample application",
      "language": "JavaScript",
      "stars": 42
    },
    "summary": {
      "purpose": "E-commerce web application",
      "mainTechnologies": ["React", "Node.js", "Express"],
      "projectType": "Web Application",
      "complexity": "medium"
    }
  },
  "architectureAnalysis": {
    "architecture": {
      "type": "layered",
      "style": "MVC with service layer",
      "layers": ["Controller", "Service", "Repository"],
      "techStack": {
        "language": "JavaScript",
        "frameworks": ["React", "Express.js"],
        "libraries": ["axios", "lodash"]
      }
    },
    "recommendations": [
      "Consider microservices for user and order modules",
      "Implement API gateway for better routing",
      "Add containerization with Docker"
    ],
    "migrationComplexity": "medium"
  }
}
```

## 🧪 Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Open `http://localhost:3000` in your browser
3. Enter a GitHub repository URL
4. Monitor real-time analysis progress
5. Review results in the tabbed interface

### API Testing
Use the provided API endpoints to test programmatically:

```bash
# Health check
curl http://localhost:3000/health

# Test analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl": "https://github.com/facebook/react"}'
```

## 🔍 Supported Repository Types

- **JavaScript/TypeScript**: React, Vue, Angular, Node.js applications
- **Java**: Spring Boot, Maven/Gradle projects
- **Python**: Django, Flask, FastAPI applications
- **Ruby**: Rails applications
- **Rust**: Cargo-based projects
- **And many more...**

## 📈 Analysis Capabilities

### Repository Analysis
- File structure categorization
- Technology stack identification
- Main file detection
- Complexity assessment
- Purpose inference

### Architecture Analysis
- Pattern recognition (MVC, Layered, Microservices)
- Component mapping
- Dependency analysis
- Entry point identification
- Migration recommendations

## 🛡️ Security Notes

- API keys are stored in environment variables
- GitHub token is optional but recommended for higher rate limits
- No sensitive data is logged or stored permanently
- All analysis data is processed in-memory

## 🚧 Development

### Project Structure
```
src/
├── agents/                 # Agent implementations
│   ├── github-analyzer/   # Agent 1
│   └── architecture-inference/ # Agent 2
├── shared/                # Shared utilities
│   ├── types/            # TypeScript types
│   └── utils/            # Common utilities
├── api/                  # REST API server
├── ui/                   # Web interface
└── index.ts             # Main entry point
```

### Adding New Agents
1. Create new directory in `src/agents/`
2. Implement agent class with `analyze()` method
3. Add to API pipeline in `src/api/index.ts`
4. Update UI to display new results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related Projects

- [LangGraph](https://github.com/langchain-ai/langgraph) - Agent workflow framework
- [LangChain](https://github.com/langchain-ai/langchain) - LLM application framework
- [Gemini API](https://ai.google.dev/) - Google's AI API