# LangGraph Architecture for AI Legacy Migration Suite

## Overview
This document outlines how LangGraph will be used to orchestrate the 8 agents in our AI-assisted legacy migration system, providing state management, workflow coordination, and human-in-the-loop capabilities.

## Core LangGraph Concepts

### State Management
```typescript
// Global state shared across all agents
interface MigrationState extends MessagesState {
  repository: {
    url: string;
    branch: string;
    files: FileStructure;
    metadata: RepoMetadata;
  };
  analysis: {
    structure: StructureAnalysis;
    architecture: ArchitectureInfo;
    codeFlow: CodeFlowMapping;
    risks: RiskAssessment;
    strategy: MigrationStrategy;
    stackUpgrade: StackUpgradeplan;
  };
  humanFeedback: {
    approvals: ApprovalRecord[];
    modifications: ModificationRecord[];
    rejections: RejectionRecord[];
  };
  progress: {
    currentAgent: string;
    completedSteps: string[];
    errors: ErrorRecord[];
  };
}
```

### Agent Workflow Architecture

```typescript
// Master orchestration workflow
const migrationWorkflow = new StateGraph(MigrationState)
  // Data gathering phase
  .addNode("github_analyzer", githubAnalyzerAgent)
  .addNode("architecture_inference", architectureInferenceAgent)
  .addNode("code_flow_analysis", codeFlowAgent)
  
  // Analysis phase
  .addNode("risk_assessment", riskAssessmentAgent)
  .addNode("migration_strategy", migrationStrategyAgent)
  .addNode("stack_upgrade", stackUpgradeAgent)
  
  // Output phase
  .addNode("human_review", humanFeedbackAgent)
  .addNode("blueprint_generator", blueprintGeneratorAgent)
  
  // Human interaction nodes
  .addNode("approval_gate", approvalGateNode)
  .addNode("modification_handler", modificationHandlerNode)
  
  // Define workflow edges
  .addEdge("github_analyzer", "architecture_inference")
  .addEdge("architecture_inference", "code_flow_analysis")
  .addConditionalEdges("code_flow_analysis", routeToAnalysis)
  .addEdge("risk_assessment", "migration_strategy")
  .addEdge("migration_strategy", "stack_upgrade")
  .addEdge("stack_upgrade", "human_review")
  .addConditionalEdges("human_review", handleHumanFeedback)
  .addEdge("approval_gate", "blueprint_generator")
  .addEdge("modification_handler", "migration_strategy")
  .setEntryPoint("github_analyzer")
  .setFinishPoint("blueprint_generator");
```

## Individual Agent Implementations

### 1. GitHub Repo Analyzer Agent
```typescript
async function githubAnalyzerAgent(state: MigrationState): Promise<MigrationState> {
  const tools = [
    new GitHubAPITool(),
    new FileParserTool(),
    new StructureAnalyzerTool()
  ];
  
  const workflow = new StateGraph(state)
    .addNode("fetch_repo", fetchRepositoryNode)
    .addNode("parse_files", parseFilesNode)
    .addNode("categorize_structure", categorizeStructureNode)
    .addNode("generate_summary", generateSummaryNode)
    .addEdge("fetch_repo", "parse_files")
    .addEdge("parse_files", "categorize_structure")
    .addEdge("categorize_structure", "generate_summary");
  
  const result = await workflow.invoke(state);
  
  return {
    ...state,
    repository: result.repository,
    progress: {
      ...state.progress,
      currentAgent: "github_analyzer",
      completedSteps: [...state.progress.completedSteps, "github_analysis"]
    }
  };
}
```

### 2. Architecture Inference Agent
```typescript
async function architectureInferenceAgent(state: MigrationState): Promise<MigrationState> {
  const tools = [
    new PatternDetectionTool(),
    new StackAnalyzerTool(),
    new LayerInferenceTool()
  ];
  
  const workflow = new StateGraph(state)
    .addNode("detect_patterns", detectPatternsNode)
    .addNode("analyze_stack", analyzeStackNode)
    .addNode("infer_layers", inferLayersNode)
    .addNode("identify_entry_points", identifyEntryPointsNode)
    .addConditionalEdges("detect_patterns", routeBasedOnPatterns)
    .addEdge("analyze_stack", "infer_layers")
    .addEdge("infer_layers", "identify_entry_points");
  
  const result = await workflow.invoke(state);
  
  return {
    ...state,
    analysis: {
      ...state.analysis,
      architecture: result.architecture
    }
  };
}
```

### 3. Human-in-the-Loop Integration
```typescript
async function humanFeedbackAgent(state: MigrationState): Promise<MigrationState> {
  const reviewWorkflow = new StateGraph(state)
    .addNode("present_findings", presentFindingsNode)
    .addNode("collect_feedback", collectFeedbackNode)
    .addNode("process_modifications", processModificationsNode)
    .addNode("validate_changes", validateChangesNode)
    .addEdge("present_findings", "collect_feedback")
    .addConditionalEdges("collect_feedback", routeBasedOnFeedback)
    .addEdge("process_modifications", "validate_changes");
  
  const result = await reviewWorkflow.invoke(state);
  
  return {
    ...state,
    humanFeedback: {
      ...state.humanFeedback,
      ...result.feedback
    }
  };
}
```

## Workflow Patterns

### 1. Sequential Pipeline
```typescript
// Each agent processes the output of the previous agent
const sequentialWorkflow = new StateGraph(MigrationState)
  .addNode("agent1", agent1)
  .addNode("agent2", agent2)
  .addNode("agent3", agent3)
  .addEdge("agent1", "agent2")
  .addEdge("agent2", "agent3");
```

### 2. Parallel Processing
```typescript
// Multiple agents work simultaneously on different aspects
const parallelWorkflow = new StateGraph(MigrationState)
  .addNode("risk_analysis", riskAnalysisAgent)
  .addNode("dependency_analysis", dependencyAnalysisAgent)
  .addNode("security_analysis", securityAnalysisAgent)
  .addNode("merge_results", mergeResultsNode)
  .addEdge("risk_analysis", "merge_results")
  .addEdge("dependency_analysis", "merge_results")
  .addEdge("security_analysis", "merge_results");
```

### 3. Conditional Routing
```typescript
// Dynamic routing based on analysis results
function routeBasedOnComplexity(state: MigrationState): string {
  if (state.analysis.architecture.complexity === "high") {
    return "detailed_analysis";
  } else if (state.analysis.architecture.type === "microservice") {
    return "microservice_specific";
  } else {
    return "standard_analysis";
  }
}

const conditionalWorkflow = new StateGraph(MigrationState)
  .addNode("initial_analysis", initialAnalysisAgent)
  .addNode("detailed_analysis", detailedAnalysisAgent)
  .addNode("microservice_specific", microserviceSpecificAgent)
  .addNode("standard_analysis", standardAnalysisAgent)
  .addConditionalEdges("initial_analysis", routeBasedOnComplexity);
```

## Error Handling and Recovery

### Retry Logic
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Fallback Strategies
```typescript
async function analyzeWithFallback(state: MigrationState): Promise<MigrationState> {
  try {
    // Try primary analysis approach
    return await primaryAnalysisAgent(state);
  } catch (error) {
    console.warn("Primary analysis failed, trying fallback", error);
    try {
      // Fallback to simpler analysis
      return await simpleAnalysisAgent(state);
    } catch (fallbackError) {
      // Last resort: return partial results
      return await partialAnalysisAgent(state);
    }
  }
}
```

## API Integration

### REST API Communication
```typescript
// API endpoint for triggering analysis
app.post('/api/analyze', async (req, res) => {
  const { repositoryUrl } = req.body;
  
  const workflowId = await migrationWorkflow.invoke({
    repository: { url: repositoryUrl },
    progress: { currentAgent: 'github_analyzer' }
  });
  
  res.json({ workflowId, status: 'started' });
});
```

### Real-time Updates
```typescript
// Server-sent events for progress updates
app.get('/api/workflow/:id/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const workflowId = req.params.id;
  const subscription = workflowManager.subscribe(workflowId, (update) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  });
  
  req.on('close', () => subscription.unsubscribe());
});
```

## Performance Optimizations

### Caching Strategy
```typescript
// Cache LLM responses to reduce API calls
class LLMCache {
  private cache = new Map<string, any>();
  
  async getCachedResponse(prompt: string, model: string): Promise<any> {
    const key = `${model}:${hashString(prompt)}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const response = await this.llm.invoke(prompt);
    this.cache.set(key, response);
    return response;
  }
}
```

### Parallel Processing
```typescript
// Process multiple files concurrently
async function processFilesInParallel(files: FileInfo[]): Promise<FileAnalysis[]> {
  const batchSize = 10;
  const results: FileAnalysis[] = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(file => analyzeFile(file))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## Monitoring and Debugging

### LangSmith Integration
```typescript
// Configure LangSmith for tracing
process.env.LANGCHAIN_TRACING_V2 = "true";
process.env.LANGCHAIN_PROJECT = "ai-legacy-migration";

// Custom callback handler for detailed logging
class CustomCallbackHandler extends BaseCallbackHandler {
  async handleLLMStart(llm: any, prompts: string[]) {
    console.log(`LLM Start: ${JSON.stringify(prompts)}`);
  }
  
  async handleLLMEnd(output: any) {
    console.log(`LLM End: ${JSON.stringify(output)}`);
  }
}
```

### Error Tracking
```typescript
// Comprehensive error tracking
class WorkflowMonitor {
  trackAgentExecution(agentName: string, state: MigrationState) {
    console.log(`Agent ${agentName} starting with state:`, state);
  }
  
  trackError(error: Error, context: any) {
    console.error(`Error in workflow:`, error);
    console.error(`Context:`, context);
    
    // Send to monitoring service
    this.sendToMonitoring({
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

This LangGraph architecture provides a robust foundation for building complex, multi-agent workflows with proper state management, error handling, and human integration capabilities.