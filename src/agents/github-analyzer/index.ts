import { 
  AgentState, 
  Repository, 
  FileStructure, 
  RepositoryAnalysis,
  FileInfo 
} from '../../shared/types';
import { 
  GitHubClient, 
  LLMClient, 
  categorizeFiles, 
  identifyMainFiles, 
  shouldProcessFile,
  logInfo, 
  logError 
} from '../../shared/utils';
import { 
  logAnalysisStart,
  logStep,
  logProgress,
  logSuccess,
  logAnalysisError,
  logRepoInfo,
  logFileAnalysis,
  logAICall
} from '../../shared/utils/simple-enhanced-logger';

export interface GitHubAnalyzerState {
  repositoryUrl: string;
  repository?: Repository;
  files?: FileInfo[];
  fileStructure?: FileStructure;
  repositoryAnalysis?: RepositoryAnalysis;
  currentStep: string;
  progress: number;
  errors: string[];
  metadata: Record<string, any>;
}

export class GitHubRepoAnalyzerAgent {
  private githubClient: GitHubClient;
  private llmClient: LLMClient;

  constructor() {
    this.githubClient = new GitHubClient();
    this.llmClient = new LLMClient({ provider: 'gemini' });
  }

  private async fetchRepository(state: GitHubAnalyzerState): Promise<GitHubAnalyzerState> {
    try {
      logInfo('Fetching repository information', { url: state.repositoryUrl });
      
      const { owner, repo } = this.githubClient.parseRepositoryUrl(state.repositoryUrl);
      const repository = await this.githubClient.getRepositoryInfo(owner, repo);
      
      return {
        ...state,
        repository,
        currentStep: 'fetch_repository',
        progress: 25
      };
    } catch (error) {
      logError('Failed to fetch repository', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to fetch repository: ${(error as Error).message}`],
        currentStep: 'fetch_repository',
        progress: 0
      };
    }
  }

  private async analyzeFiles(state: GitHubAnalyzerState): Promise<GitHubAnalyzerState> {
    try {
      if (!state.repository) {
        throw new Error('Repository information not available');
      }

      logInfo('Analyzing repository files', { repo: state.repository.name });
      
      const { owner, repo } = this.githubClient.parseRepositoryUrl(state.repositoryUrl);
      const files = await this.githubClient.getAllFiles(owner, repo, state.repository.branch);
      
      // Filter files for processing
      const processableFiles = files.filter(file => shouldProcessFile(file));
      
      // Get content for key files
      const filesWithContent = await Promise.all(
        processableFiles.slice(0, 3000).map(async (file) => {
          try {
            if (file.type === 'file' && file.size && file.size < 10000) {
              const content = await this.githubClient.getFileContent(owner, repo, file.path, state.repository?.branch);
              return { ...file, content };
            }
          } catch (error) {
            logError(`Failed to get content for ${file.path}`, error as Error);
          }
          return file;
        })
      );
      
      return {
        ...state,
        files: filesWithContent,
        currentStep: 'analyze_files',
        progress: 50
      };
    } catch (error) {
      logError('Failed to analyze files', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to analyze files: ${(error as Error).message}`],
        currentStep: 'analyze_files',
        progress: 25
      };
    }
  }

  private async categorizeStructure(state: GitHubAnalyzerState): Promise<GitHubAnalyzerState> {
    try {
      if (!state.files) {
        throw new Error('Files not available');
      }

      logInfo('Categorizing file structure');
      
      const categories = categorizeFiles(state.files);
      const mainFiles = identifyMainFiles(state.files);
      
      const fileStructure: FileStructure = {
        totalFiles: state.files.filter(f => f.type === 'file').length,
        totalDirectories: state.files.filter(f => f.type === 'directory').length,
        files: state.files,
        categories,
        mainFiles
      };
      
      return {
        ...state,
        fileStructure,
        currentStep: 'categorize_structure',
        progress: 75
      };
    } catch (error) {
      logError('Failed to categorize structure', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to categorize structure: ${(error as Error).message}`],
        currentStep: 'categorize_structure',
        progress: 50
      };
    }
  }

  private async generateSummary(state: GitHubAnalyzerState): Promise<GitHubAnalyzerState> {
    try {
      if (!state.repository || !state.fileStructure) {
        throw new Error('Repository or file structure not available');
      }

      logInfo('Generating repository summary');
      
      const analysisPrompt = this.createAnalysisPrompt(state.repository, state.fileStructure);
      
      // Log AI call
      logAICall('Repository Summary Generation', analysisPrompt);
      
      const summaryResponse = await this.llmClient.generateStructuredResponse<{
        purpose: string;
        mainTechnologies: string[];
        projectType: string;
        complexity: 'low' | 'medium' | 'high';
        insights: string[];
      }>(
        analysisPrompt,
        JSON.stringify({
          purpose: 'string',
          mainTechnologies: ['string'],
          projectType: 'string',
          complexity: 'low | medium | high',
          insights: ['string']
        }),
        'You are an expert software architect analyzing a GitHub repository. Provide a comprehensive analysis based on the repository structure and files.'
      );
      
      // Log AI response
      logAICall('Repository Summary Received', undefined, summaryResponse);
      
      const repositoryAnalysis: RepositoryAnalysis = {
        repository: state.repository,
        fileStructure: state.fileStructure,
        summary: {
          purpose: summaryResponse.purpose,
          mainTechnologies: summaryResponse.mainTechnologies,
          projectType: summaryResponse.projectType,
          complexity: summaryResponse.complexity
        },
        insights: summaryResponse.insights,
        timestamp: new Date().toISOString()
      };
      
      return {
        ...state,
        repositoryAnalysis,
        currentStep: 'generate_summary',
        progress: 100
      };
    } catch (error) {
      logError('Failed to generate summary', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to generate summary: ${(error as Error).message}`],
        currentStep: 'generate_summary',
        progress: 75
      };
    }
  }

  private createAnalysisPrompt(repository: Repository, fileStructure: FileStructure): string {
    const mainFilesInfo = fileStructure.mainFiles.map(f => `- ${f.name} (${f.path})`).join('\n');
    const categorySummary = Object.entries(fileStructure.categories)
      .map(([category, files]) => `${category}: ${files.length} files`)
      .join(', ');
    
    const sampleFiles = fileStructure.files
      .filter(f => f.content && f.content.length > 0)
      .slice(0, 5)
      .map(f => `File: ${f.path}\n${f.content!.slice(0, 2000)}...`)
      .join('\n\n');

    return `
Analyze this GitHub repository:

Repository: ${repository.name}
Description: ${repository.description || 'No description provided'}
Primary Language: ${repository.language || 'Unknown'}
Stars: ${repository.stars || 0}
Forks: ${repository.forks || 0}

File Structure:
- Total files: ${fileStructure.totalFiles}
- Total directories: ${fileStructure.totalDirectories}
- Categories: ${categorySummary}

Main Files:
${mainFilesInfo}

Sample File Contents:
${sampleFiles}

Based on this information, provide:
1. The main purpose of this repository
2. The primary technologies used
3. The type of project (web app, library, CLI tool, etc.)
4. The complexity level (low, medium, high)
5. Key insights about the codebase structure and organization

Please respond with a JSON object matching the specified schema.
    `;
  }

  async analyze(repositoryUrl: string): Promise<RepositoryAnalysis> {
    // Start enhanced logging
    logAnalysisStart('GitHub Repository Analysis', { repositoryUrl });
    
    try {
      let state: GitHubAnalyzerState = {
        repositoryUrl,
        currentStep: 'init',
        progress: 0,
        errors: [],
        metadata: {}
      };

      // Execute workflow steps sequentially with enhanced logging
      logStep('Repository Fetch', { url: repositoryUrl });
      state = await this.fetchRepository(state);
      if (state.errors.length > 0) {
        throw new Error(`Fetch repository failed: ${state.errors.join(', ')}`);
      }
      
      if (state.repository) {
        logRepoInfo(state.repository);
      }

      logStep('File Analysis', { targetFiles: 'Processing repository files' });
      state = await this.analyzeFiles(state);
      if (state.errors.length > 0) {
        throw new Error(`Analyze files failed: ${state.errors.join(', ')}`);
      }
      
      if (state.files) {
        logProgress(`Analyzed ${state.files.length} files`);
      }

      logStep('File Categorization', { operation: 'Organizing files by category' });
      state = await this.categorizeStructure(state);
      if (state.errors.length > 0) {
        throw new Error(`Categorize structure failed: ${state.errors.join(', ')}`);
      }
      
      if (state.fileStructure) {
        logFileAnalysis(state.fileStructure);
      }

      logStep('AI Summary Generation', { model: 'Gemini AI' });
      state = await this.generateSummary(state);
      if (state.errors.length > 0) {
        throw new Error(`Generate summary failed: ${state.errors.join(', ')}`);
      }
      
      if (!state.repositoryAnalysis) {
        throw new Error('Repository analysis not completed');
      }
      
      // Log successful completion
      logSuccess('GitHub Repository Analysis Completed', {
        repository: state.repositoryAnalysis.repository.name,
        totalFiles: state.repositoryAnalysis.fileStructure.totalFiles,
        projectType: state.repositoryAnalysis.summary.projectType,
        complexity: state.repositoryAnalysis.summary.complexity
      });
      
      return state.repositoryAnalysis;
    } catch (error) {
      logAnalysisError('GitHub repository analysis failed', error as Error);
      throw error;
    }
  }
}

export default GitHubRepoAnalyzerAgent;