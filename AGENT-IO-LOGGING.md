# Agent Input/Output Logging System

## Overview

The Agent I/O Logging System provides detailed visibility into the exact data flowing between agents in the AI Legacy Migration Suite. This system captures the precise input and output of each agent, making debugging and optimization much easier.

## Features

### 📥 **Input Logging**
- **Complete input capture** - Every piece of data sent to an agent
- **Input structure analysis** - Data types, sizes, and key metrics
- **File persistence** - Detailed JSON files saved for later analysis
- **Unique tracking IDs** - Link inputs to outputs and errors

### 📤 **Output Logging**
- **Complete output capture** - Every piece of data produced by an agent
- **Execution timing** - How long each agent took to process
- **Output structure analysis** - Result types, sizes, and key metrics
- **Comparison views** - Input vs output analysis

### 💥 **Error Logging**
- **Error context** - Links errors back to the input that caused them
- **Timing information** - How long before the agent failed
- **Detailed error information** - Stack traces and error context
- **Recovery information** - What data was available when error occurred

## What You'll See

### Agent 2 (Architecture Inference) Input
```
📥 AGENT INPUT
Agent: Architecture Inference Agent
Operation: analyze
Input ID: mdd9mbkuqatpsd3imfa
Timestamp: 9:03:24 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 INPUT STRUCTURE:
   Type: Object
   Properties: 5
   Keys: repository, fileStructure, summary, insights, timestamp
   JSON Size: 12847 characters
   Memory Size: ~13 KB

🔢 KEY INPUT METRICS:
   Repository: struts2-project (user123)
   Language: Java
   Stars: 0
   Total Files: 13
   Directories: 0
   File Categories: 8
     source: 7 files
     config: 4 files
     documentation: 1 files
     dependency: 1 files
   Main Files: 1
   Project Type: web application
   Complexity: medium
   Technologies: 3 identified
   Insights: 4 generated

💾 Detailed input saved to: architecture-inference-agent-analyze-input-mdd9mbkuqatpsd3imfa.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Agent 2 (Architecture Inference) Output
```
📤 AGENT OUTPUT
Agent: Architecture Inference Agent
Operation: analyze
Output ID: mff8nclvratqtd4inab
Related Input ID: mdd9mbkuqatpsd3imfa
Execution Time: 23.45s
Timestamp: 9:03:47 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OUTPUT STRUCTURE:
   Type: Object
   Properties: 7
   Keys: repository, architecture, recommendations, migrationComplexity, fileAnalysis, architectureDetails, timestamp
   JSON Size: 18923 characters
   Memory Size: ~18 KB

🔢 KEY OUTPUT METRICS:
   Architecture Type: layered
   Complexity: medium
   Layers: 3
   Components: 5
   Entry Points: 2
   Patterns: 2
   Tech Stack:
     Language: Java
     Frameworks: 2
     Libraries: 1
     Tools: 3
   Recommendations: 6
   Migration Complexity: medium
   File Analysis:
     Total: 13
     Source: 7
     Config: 4
     Tests: 0

💾 Detailed output saved to: architecture-inference-agent-analyze-output-mff8nclvratqtd4inab.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Input/Output Comparison
```
🔄 AGENT INPUT/OUTPUT COMPARISON
Agent: Architecture Inference Agent
Operation: analyze
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 INPUT SUMMARY:
   Size: 12847 characters (13 KB)

📤 OUTPUT SUMMARY:
   Size: 18923 characters (18 KB)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## File Storage

### Log Files Location
All detailed logs are stored in `logs/agent-io/` directory:

```
logs/agent-io/
├── architecture-inference-agent-analyze-input-{id}.json
├── architecture-inference-agent-analyze-output-{id}.json
├── code-flow-agent-analyze-input-{id}.json
├── code-flow-agent-analyze-output-{id}.json
└── {agent-name}-{operation}-error-{id}.json
```

### Input File Structure
```json
{
  "agentName": "Architecture Inference Agent",
  "operation": "analyze",
  "timestamp": "2025-07-21T15:33:24.201Z",
  "input": {
    "repository": {
      "url": "https://github.com/user/repo",
      "name": "struts2-project",
      "owner": "user123",
      "language": "Java",
      // ... complete repository data
    },
    "fileStructure": {
      "totalFiles": 13,
      "totalDirectories": 0,
      "files": [/* all file data */],
      "categories": {/* categorized files */},
      // ... complete file structure
    },
    "summary": {
      "purpose": "Web application using Struts2 framework",
      "mainTechnologies": ["Java", "Struts2", "Maven"],
      "projectType": "web application",
      "complexity": "medium"
    },
    "insights": [/* AI-generated insights */],
    "timestamp": "2025-07-21T15:33:19.185Z"
  }
}
```

### Output File Structure
```json
{
  "agentName": "Architecture Inference Agent",
  "operation": "analyze",
  "timestamp": "2025-07-21T15:33:47.456Z",
  "output": {
    "repository": {/* same as input */},
    "architecture": {
      "type": "layered",
      "style": "Traditional three-tier web application",
      "layers": ["Presentation", "Business", "Data"],
      "components": [/* detected components */],
      "entryPoints": [/* entry points */],
      "techStack": {
        "language": "Java",
        "frameworks": ["Struts2", "Spring"],
        "libraries": ["Log4j"],
        "tools": ["Maven", "JUnit", "Tomcat"]
      },
      "patterns": ["MVC", "Layered"],
      "complexity": "medium"
    },
    "recommendations": [/* modernization recommendations */],
    "migrationComplexity": "medium",
    "fileAnalysis": {/* file analysis details */},
    "architectureDetails": {
      "strengths": [/* architecture strengths */],
      "weaknesses": [/* potential issues */],
      "riskFactors": [/* migration risks */],
      "modernizationPriority": "medium"
    },
    "timestamp": "2025-07-21T15:33:47.456Z"
  },
  "executionTime": 23.45
}
```

## Data Flow Analysis

### Agent 1 → Agent 2
**Input to Architecture Inference Agent:**
- `Repository` metadata (name, owner, language, stars, description)
- `FileStructure` with categorized files and analysis
- `Summary` with AI-generated purpose, technologies, project type
- `Insights` array with repository observations
- `Timestamp` of analysis

**Output from Architecture Inference Agent:**
- `Architecture` with type, style, layers, components, patterns
- `TechStack` with detailed technology breakdown
- `Recommendations` for modernization
- `MigrationComplexity` assessment
- `FileAnalysis` with detailed breakdowns
- `ArchitectureDetails` with strengths/weaknesses/risks

### Agent 2 → Agent 3
**Input to Code Flow Agent:**
- Complete `RepositoryAnalysis` from Agent 1
- Complete `ArchitectureAnalysis` from Agent 2

**Output from Code Flow Agent:**
- `CodeFlow` with execution paths, entry points, call graphs
- `Dependencies` with internal/external/circular dependency analysis
- `DataFlow` with data streams, stores, transformations, bottlenecks
- `Recommendations` for code flow optimization
- `Complexity` assessment

## Usage in Development

### Debugging Failed Analysis
1. **Check error logs** in `logs/agent-io/` for detailed failure context
2. **Examine input data** that caused the failure
3. **Compare with successful runs** to identify patterns
4. **Use timing information** to identify performance bottlenecks

### Optimizing Agent Performance
1. **Monitor execution times** for each agent
2. **Analyze input/output size ratios** to understand data transformation
3. **Track memory usage** through JSON size metrics
4. **Identify common failure patterns** from error logs

### Validating Agent Behavior
1. **Verify input structure** matches expected format
2. **Check output completeness** - all required fields present
3. **Validate data transformations** - input properly processed
4. **Ensure error handling** - proper cleanup on failures

## Configuration

### Log File Retention
The system automatically creates the `logs/agent-io/` directory and stores all I/O logs there. You may want to implement log rotation for production use.

### Disabling I/O Logging
To disable detailed I/O logging (for performance), you can:
1. Set environment variable: `DISABLE_AGENT_IO_LOGGING=true`
2. Comment out the logging calls in agent files
3. Modify the logger to no-op operations

### Memory Considerations
- Large repositories may generate substantial log files (100KB - 1MB+)
- Consider implementing log file size limits for production
- Monitor disk space usage in `logs/` directory

## Benefits

### 🔍 **Debugging**
- **Exact input/output capture** eliminates guesswork
- **Error context** shows what data caused failures
- **Timing information** helps identify bottlenecks
- **Complete audit trail** for troubleshooting

### 📊 **Analysis**
- **Data transformation insights** show how agents process information
- **Performance metrics** for optimization opportunities
- **Pattern recognition** across different repository types
- **Quality assessment** of agent outputs

### 🛠️ **Development**
- **Test data generation** using real input/output examples
- **Integration testing** with actual data flows
- **Performance profiling** with detailed timing
- **Regression testing** by comparing outputs over time

This Agent I/O Logging System provides complete visibility into the data pipeline, making the AI Legacy Migration Suite much easier to debug, optimize, and understand.