import express from 'express';
import cors from 'cors';
import path from 'path';
import { 
  AnalysisRequest, 
  AnalysisResponse, 
  RepositoryAnalysis, 
  ArchitectureAnalysis,
  CodeFlowAnalysis,
  RiskAssessment 
} from '../shared/types';
import { logInfo, logError } from '../shared/utils';
import GitHubRepoAnalyzerAgent from '../agents/github-analyzer';
import ArchitectureInferenceAgent from '../agents/architecture-inference';
import { CodeFlowAgent } from '../agents/code-flow';
import RiskAssessmentAgent from '../agents/risk-assessment';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static UI
app.use(express.static(path.join(__dirname, '../ui')));

// In-memory storage for analysis results (in production, use a database)
const analysisResults = new Map<string, AnalysisResponse>();

// Initialize agents
const githubAnalyzer = new GitHubRepoAnalyzerAgent();
const architectureInference = new ArchitectureInferenceAgent();
const codeFlowAgent = new CodeFlowAgent();
const riskAssessmentAgent = new RiskAssessmentAgent();

// Generate unique analysis ID
function generateAnalysisId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Health check endpoint
app.get('/health', (req, res) => {
  return res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const request: AnalysisRequest = req.body;
    
    if (!request.repositoryUrl) {
      return res.status(400).json({
        error: 'Repository URL is required'
      });
    }

    const analysisId = generateAnalysisId();
    
    // Create initial analysis response
    const analysisResponse: AnalysisResponse = {
      id: analysisId,
      status: 'pending',
      progress: 0,
      currentStep: 'initialized',
      createdAt: new Date().toISOString()
    };
    
    analysisResults.set(analysisId, analysisResponse);
    
    // Start analysis asynchronously
    performAnalysis(analysisId, request);
    
    return res.json({
      analysisId,
      status: 'started',
      message: 'Analysis started successfully'
    });
    
  } catch (error) {
    logError('Failed to start analysis', error as Error);
    return res.status(500).json({
      error: 'Failed to start analysis',
      message: (error as Error).message
    });
  }
});

// Get analysis status and results
app.get('/api/analysis/:id', (req, res) => {
  const analysisId = req.params.id;
  const result = analysisResults.get(analysisId);
  
  if (!result) {
    return res.status(404).json({
      error: 'Analysis not found'
    });
  }
  
  return res.json(result);
});

// Get all analyses (for debugging)
app.get('/api/analyses', (req, res) => {
  const analyses = Array.from(analysisResults.values());
  return res.json(analyses);
});

// Delete analysis
app.delete('/api/analysis/:id', (req, res) => {
  const analysisId = req.params.id;
  const deleted = analysisResults.delete(analysisId);
  
  if (!deleted) {
    return res.status(404).json({
      error: 'Analysis not found'
    });
  }
  
  return res.json({ message: 'Analysis deleted successfully' });
});

// Server-sent events for real-time updates
app.get('/api/analysis/:id/stream', (req, res) => {
  const analysisId = req.params.id;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Send initial data
  const result = analysisResults.get(analysisId);
  if (result) {
    res.write(`data: ${JSON.stringify(result)}\n\n`);
  }
  
  // Set up periodic updates
  const interval = setInterval(() => {
    const updatedResult = analysisResults.get(analysisId);
    if (updatedResult) {
      res.write(`data: ${JSON.stringify(updatedResult)}\n\n`);
      
      // Close connection when analysis is complete
      if (updatedResult.status === 'completed' || updatedResult.status === 'failed') {
        clearInterval(interval);
        res.end();
      }
    }
  }, 1000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Perform the actual analysis
async function performAnalysis(analysisId: string, request: AnalysisRequest) {
  try {
    const result = analysisResults.get(analysisId);
    if (!result) return;
    
    logInfo(`Starting analysis for ${request.repositoryUrl}`, { analysisId });
    
    // Update status to running
    result.status = 'running';
    result.progress = 0;
    result.currentStep = 'Starting GitHub analysis';
    
    // Step 1: GitHub Repository Analysis
    logInfo('Running GitHub repository analysis', { analysisId });
    result.currentStep = 'Analyzing GitHub repository';
    result.progress = 10;
    
    const repositoryAnalysis: RepositoryAnalysis = await githubAnalyzer.analyze(request.repositoryUrl);
    
    result.progress = 50;
    result.currentStep = 'Repository analysis completed';
    result.result = { repositoryAnalysis };
    
    // Step 2: Architecture Inference
    logInfo('Running architecture inference', { analysisId });
    result.currentStep = 'Inferring architecture patterns';
    result.progress = 60;
    
    const architectureAnalysis: ArchitectureAnalysis = await architectureInference.analyze(repositoryAnalysis);
    
    result.progress = 70;
    result.currentStep = 'Architecture inference completed';
    result.result!.architectureAnalysis = architectureAnalysis;
    
    // Step 3: Code Flow Analysis
    logInfo('Running code flow analysis', { analysisId });
    result.currentStep = 'Analyzing code flow and dependencies';
    result.progress = 75;
    
    const codeFlowAnalysis: CodeFlowAnalysis = await codeFlowAgent.analyze(repositoryAnalysis, architectureAnalysis);
    
    result.progress = 80;
    result.currentStep = 'Code flow analysis completed';
    result.result!.codeFlowAnalysis = codeFlowAnalysis;
    
    // Step 4: Risk Assessment Analysis
    logInfo('Running risk assessment analysis', { analysisId });
    result.currentStep = 'Assessing migration risks and vulnerabilities';
    result.progress = 90;
    
    const riskAssessment: RiskAssessment = await riskAssessmentAgent.analyze(repositoryAnalysis, architectureAnalysis, codeFlowAnalysis);
    
    result.progress = 100;
    result.currentStep = 'Analysis completed';
    result.result!.riskAssessment = riskAssessment;
    result.status = 'completed';
    result.completedAt = new Date().toISOString();
    
    logInfo('Analysis completed successfully', { 
      analysisId, 
      repository: repositoryAnalysis.repository.name,
      architecture: architectureAnalysis.architecture.type,
      codeFlowComplexity: codeFlowAnalysis.complexity,
      riskScore: riskAssessment.overallRiskScore
    });
    
  } catch (error) {
    logError('Analysis failed', error as Error, { analysisId });
    
    const result = analysisResults.get(analysisId);
    if (result) {
      result.status = 'failed';
      result.error = (error as Error).message;
      result.completedAt = new Date().toISOString();
    }
  }
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Unhandled error in API', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  logInfo(`Server running on port ${port}`);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔍 API endpoint: http://localhost:${port}/api/analyze`);
});

export default app;