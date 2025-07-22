import { 
  Repository, 
  FileStructure, 
  RepositoryAnalysis,
  ArchitectureAnalysis,
  ArchitectureInfo,
  ComponentInfo,
  EntryPoint,
  TechStack,
  FileInfo,
  FileCategory
} from '../../shared/types';
import { 
  LLMClient, 
  logInfo, 
  logError 
} from '../../shared/utils';
import { 
  logStep,
  logProgress,
  logSuccess,
  logAnalysisError,
  logAICall,
  logArchitectureDetection
} from '../../shared/utils/simple-enhanced-logger';
import { 
  logAgent2Input,
  logAgent2Output,
  logAgent2Error,
  agentIOLogger
} from '../../shared/utils/agent-io-logger';

export interface ArchitectureInferenceState {
  repositoryAnalysis: RepositoryAnalysis;
  architectureAnalysis?: ArchitectureAnalysis;
  currentStep: string;
  progress: number;
  errors: string[];
  metadata: Record<string, any>;
}

export class ArchitectureInferenceAgent {
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient({ provider: 'gemini' });
  }

  private async detectArchitecturePatterns(state: ArchitectureInferenceState): Promise<ArchitectureInferenceState> {
    try {
      logInfo('Detecting architecture patterns using AI');
      
      const { fileStructure } = state.repositoryAnalysis;
      
      // Create comprehensive file structure JSON for AI analysis
      const fileStructureJson = this.createFileStructureJson(fileStructure);
      
      // Use AI to detect patterns from file structure
      const patterns = await this.detectPatternsWithAI(fileStructureJson, state.repositoryAnalysis);
      
      return {
        ...state,
        currentStep: 'detect_patterns',
        progress: 25,
        metadata: {
          ...state.metadata,
          detectedPatterns: patterns,
          fileStructureJson // Keep for debugging
        }
      };
    } catch (error) {
      logError('Failed to detect architecture patterns with AI, falling back to rule-based', error as Error);
      
      // Fallback to rule-based detection if AI fails
      const fallbackPatterns = this.analyzeStructuralPatterns(state.repositoryAnalysis.fileStructure);
      
      return {
        ...state,
        currentStep: 'detect_patterns',
        progress: 25,
        metadata: {
          ...state.metadata,
          detectedPatterns: fallbackPatterns,
          patternDetectionMethod: 'fallback_rules'
        }
      };
    }
  }

  private async analyzeTechStack(state: ArchitectureInferenceState): Promise<ArchitectureInferenceState> {
    try {
      logInfo('Analyzing tech stack');
      
      const { fileStructure } = state.repositoryAnalysis;
      const techStack = await this.inferTechStack(fileStructure);
      
      return {
        ...state,
        currentStep: 'analyze_tech_stack',
        progress: 50,
        metadata: {
          ...state.metadata,
          techStack
        }
      };
    } catch (error) {
      logError('Failed to analyze tech stack', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to analyze tech stack: ${(error as Error).message}`],
        currentStep: 'analyze_tech_stack',
        progress: 25
      };
    }
  }

  private async inferComponents(state: ArchitectureInferenceState): Promise<ArchitectureInferenceState> {
    try {
      logInfo('Inferring components and layers');
      
      const { fileStructure } = state.repositoryAnalysis;
      const components = await this.identifyComponents(fileStructure);
      const entryPoints = this.identifyEntryPoints(fileStructure);
      
      return {
        ...state,
        currentStep: 'infer_components',
        progress: 75,
        metadata: {
          ...state.metadata,
          components,
          entryPoints
        }
      };
    } catch (error) {
      logError('Failed to infer components', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to infer components: ${(error as Error).message}`],
        currentStep: 'infer_components',
        progress: 50
      };
    }
  }

  private async generateArchitectureAnalysis(state: ArchitectureInferenceState): Promise<ArchitectureInferenceState> {
    try {
      logInfo('Generating architecture analysis');
      
      const architecturePrompt = this.createArchitecturePrompt(state);
      
      let architectureResponse;
      
      // Try full analysis first
      try {
        architectureResponse = await this.llmClient.generateStructuredResponse<{
          type: 'monolith' | 'microservices' | 'layered' | 'modular' | 'unknown';
          style: string;
          layers: string[];
          patterns: string[];
          complexity: 'low' | 'medium' | 'high';
          recommendations: string[];
          migrationComplexity: 'low' | 'medium' | 'high';
          fileAnalysis: {
            totalFiles: number;
            sourceFiles: number;
            configFiles: number;
            testFiles: number;
            documentationFiles: number;
            keyFiles: string[];
          };
          architectureDetails: {
            strengths: string[];
            weaknesses: string[];
            riskFactors: string[];
            modernizationPriority: 'low' | 'medium' | 'high';
          };
        }>(
          architecturePrompt,
          JSON.stringify({
            type: 'monolith | microservices | layered | modular | unknown',
            style: 'string',
            layers: ['string'],
            patterns: ['string'],
            complexity: 'low | medium | high',
            recommendations: ['string'],
            migrationComplexity: 'low | medium | high',
            fileAnalysis: {
              totalFiles: 'number',
              sourceFiles: 'number',
              configFiles: 'number',
              testFiles: 'number',
              documentationFiles: 'number',
              keyFiles: ['string']
            },
            architectureDetails: {
              strengths: ['string'],
              weaknesses: ['string'],
              riskFactors: ['string'],
              modernizationPriority: 'low | medium | high'
            }
          }),
          'You are an expert software architect analyzing repository structure to infer architecture patterns and provide modernization recommendations.'
        );
      } catch (error) {
        logError('Full architecture analysis failed, trying simplified approach', error as Error);
        
        // Fallback to simpler prompt for large projects
        const simplifiedPrompt = this.createSimplifiedArchitecturePrompt(state);
        architectureResponse = await this.llmClient.generateStructuredResponse<{
          type: 'monolith' | 'microservices' | 'layered' | 'modular' | 'unknown';
          style: string;
          layers: string[];
          patterns: string[];
          complexity: 'low' | 'medium' | 'high';
          recommendations: string[];
          migrationComplexity: 'low' | 'medium' | 'high';
          fileAnalysis: {
            totalFiles: number;
            sourceFiles: number;
            configFiles: number;
            testFiles: number;
            documentationFiles: number;
            keyFiles: string[];
          };
          architectureDetails: {
            strengths: string[];
            weaknesses: string[];
            riskFactors: string[];
            modernizationPriority: 'low' | 'medium' | 'high';
          };
        }>(
          simplifiedPrompt,
          JSON.stringify({
            type: 'monolith | microservices | layered | modular | unknown',
            style: 'string',
            layers: ['string'],
            patterns: ['string'],
            complexity: 'low | medium | high',
            recommendations: ['string'],
            migrationComplexity: 'low | medium | high',
            fileAnalysis: {
              totalFiles: 'number',
              sourceFiles: 'number',
              configFiles: 'number',
              testFiles: 'number',
              documentationFiles: 'number',
              keyFiles: ['string']
            },
            architectureDetails: {
              strengths: ['string'],
              weaknesses: ['string'],
              riskFactors: ['string'],
              modernizationPriority: 'low | medium | high'
            }
          }),
          'You are an expert software architect. Provide a concise architecture analysis.'
        );
      }
      
      const architectureInfo: ArchitectureInfo = {
        type: architectureResponse.type,
        style: architectureResponse.style,
        layers: architectureResponse.layers,
        components: state.metadata.components || [],
        entryPoints: state.metadata.entryPoints || [],
        techStack: state.metadata.techStack || {
          language: state.repositoryAnalysis.repository.language || 'Unknown',
          frameworks: [],
          libraries: [],
          databases: [],
          tools: []
        },
        patterns: architectureResponse.patterns,
        complexity: architectureResponse.complexity
      };
      
      const architectureAnalysis: ArchitectureAnalysis = {
        repository: state.repositoryAnalysis.repository,
        architecture: architectureInfo,
        recommendations: architectureResponse.recommendations,
        migrationComplexity: architectureResponse.migrationComplexity,
        fileAnalysis: architectureResponse.fileAnalysis || {
          totalFiles: state.repositoryAnalysis.fileStructure.totalFiles,
          sourceFiles: state.repositoryAnalysis.fileStructure.categories.source?.length || 0,
          configFiles: state.repositoryAnalysis.fileStructure.categories.config?.length || 0,
          testFiles: state.repositoryAnalysis.fileStructure.categories.test?.length || 0,
          documentationFiles: state.repositoryAnalysis.fileStructure.categories.documentation?.length || 0,
          keyFiles: state.repositoryAnalysis.fileStructure.mainFiles?.map(f => f.name) || []
        },
        architectureDetails: architectureResponse.architectureDetails || {
          strengths: [],
          weaknesses: [],
          riskFactors: [],
          modernizationPriority: 'medium'
        },
        timestamp: new Date().toISOString()
      };
      
      return {
        ...state,
        architectureAnalysis,
        currentStep: 'generate_analysis',
        progress: 100
      };
    } catch (error) {
      logError('Failed to generate architecture analysis', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to generate analysis: ${(error as Error).message}`],
        currentStep: 'generate_analysis',
        progress: 75
      };
    }
  }

  private createFileStructureJson(fileStructure: FileStructure): any {
    try {
      // Create a hierarchical directory structure
      const directoryTree: any = {};
      
      fileStructure.files.forEach(file => {
        const pathParts = file.path.split('/');
        let current = directoryTree;
        
        // Build nested directory structure
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = {
              type: 'directory',
              children: {},
              files: []
            };
          }
          current = current[part].children;
        }
        
        // Add file to the final directory
        const fileName = pathParts[pathParts.length - 1];
        if (!current.files) current.files = [];
        current.files.push({
          name: fileName,
          path: file.path,
          type: file.type,
          extension: file.extension,
          size: file.size,
          hasContent: !!file.content
        });
      });
      
      // Create flat structure for AI analysis
      const filesByDirectory = new Map<string, any[]>();
      
      fileStructure.files.forEach(file => {
        const directory = file.path.includes('/') 
          ? file.path.substring(0, file.path.lastIndexOf('/'))
          : 'root';
          
        if (!filesByDirectory.has(directory)) {
          filesByDirectory.set(directory, []);
        }
        
        filesByDirectory.get(directory)!.push({
          name: file.name,
          path: file.path,
          extension: file.extension,
          type: file.type,
          size: file.size,
          category: file.category,
          hasContent: !!file.content
        });
      });
      
      // Convert to JSON structure optimized for AI analysis
      const structureForAI = {
        summary: {
          totalFiles: fileStructure.totalFiles,
          totalDirectories: fileStructure.totalDirectories,
          fileCategories: (Object.keys(fileStructure.categories) as FileCategory[]).map(category => ({
            category,
            count: fileStructure.categories[category]?.length || 0,
            files: fileStructure.categories[category]?.slice(0, 10).map((f: FileInfo) => f.name) || []
          })),
          mainFiles: fileStructure.mainFiles.map(f => ({
            name: f.name,
            path: f.path,
            purpose: this.inferFilePurpose(f.name, f.path)
          }))
        },
        directoryStructure: Array.from(filesByDirectory.entries()).map(([dir, files]) => ({
          directory: dir,
          fileCount: files.length,
          files: files.slice(0, 15), // Limit to prevent large payloads
          fileTypes: [...new Set(files.map(f => f.extension).filter(Boolean))],
          hasSubdirectories: files.some(f => f.path.split('/').length > (dir === 'root' ? 1 : dir.split('/').length + 1)),
          purpose: this.inferDirectoryPurpose(dir, files)
        })).filter(d => d.fileCount > 0),
        architecturalIndicators: {
          hasConfigFiles: fileStructure.files.some(f => f.category === 'config'),
          hasTestFiles: fileStructure.files.some(f => f.category === 'test'),
          hasBuildFiles: fileStructure.files.some(f => f.category === 'build'),
          hasDockerFiles: fileStructure.files.some(f => f.name.toLowerCase().includes('docker')),
          hasServiceFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('service')),
          hasControllerFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('controller')),
          hasModelFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('model')),
          hasViewFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('view') || f.path.toLowerCase().includes('template')),
          hasComponentFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('component')),
          hasModuleFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('module')),
          hasApiFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('api') || f.path.toLowerCase().includes('route')),
          hasMiddlewareFiles: fileStructure.files.some(f => f.path.toLowerCase().includes('middleware')),
          maxDirectoryDepth: Math.max(...fileStructure.files.map(f => f.path.split('/').length))
        }
      };
      
      return structureForAI;
    } catch (error) {
      logError('Failed to create file structure JSON', error as Error);
      return { error: 'Failed to parse file structure' };
    }
  }
  
  private inferFilePurpose(fileName: string, filePath: string): string {
    const lower = fileName.toLowerCase();
    const path = filePath.toLowerCase();
    
    if (lower.includes('index')) return 'entry_point';
    if (lower.includes('main')) return 'main_entry';
    if (lower.includes('app')) return 'application_root';
    if (lower.includes('server')) return 'server_entry';
    if (lower.includes('config')) return 'configuration';
    if (lower.includes('package.json')) return 'dependency_manifest';
    if (lower.includes('readme')) return 'documentation';
    if (lower.includes('dockerfile')) return 'containerization';
    if (path.includes('test')) return 'testing';
    if (path.includes('spec')) return 'specification';
    
    return 'source_code';
  }
  
  private inferDirectoryPurpose(directory: string, files: any[]): string {
    const lower = directory.toLowerCase();
    const fileNames = files.map(f => f.name.toLowerCase()).join(' ');
    
    if (lower.includes('controller')) return 'mvc_controllers';
    if (lower.includes('model')) return 'data_models';
    if (lower.includes('view') || lower.includes('template')) return 'presentation_views';
    if (lower.includes('service')) return 'business_services';
    if (lower.includes('repository') || lower.includes('dao')) return 'data_access';
    if (lower.includes('component')) return 'ui_components';
    if (lower.includes('module')) return 'feature_modules';
    if (lower.includes('api') || lower.includes('route')) return 'api_endpoints';
    if (lower.includes('middleware')) return 'request_middleware';
    if (lower.includes('util') || lower.includes('helper')) return 'utilities';
    if (lower.includes('config')) return 'configuration';
    if (lower.includes('test') || lower.includes('spec')) return 'testing';
    if (lower.includes('doc')) return 'documentation';
    if (lower.includes('asset') || lower.includes('static')) return 'static_assets';
    if (lower.includes('public')) return 'public_resources';
    if (lower.includes('src') || lower.includes('source')) return 'source_code';
    if (lower.includes('lib') || lower.includes('vendor')) return 'external_libraries';
    
    // Infer from file types
    if (fileNames.includes('controller')) return 'mvc_controllers';
    if (fileNames.includes('service')) return 'business_services';
    if (fileNames.includes('model')) return 'data_models';
    if (files.some(f => f.extension === 'test.js' || f.extension === 'spec.js')) return 'testing';
    
    return 'source_code';
  }
  
  private async detectPatternsWithAI(fileStructureJson: any, repositoryAnalysis: any): Promise<string[]> {
    try {
      const prompt = this.createPatternDetectionPrompt(fileStructureJson, repositoryAnalysis);
      
      const response = await this.llmClient.generateStructuredResponse<{
        detectedPatterns: {
          pattern: string;
          confidence: 'high' | 'medium' | 'low';
          evidence: string[];
          description: string;
        }[];
        primaryArchitecture: string;
        architecturalStyle: string;
        reasoning: string;
      }>(
        prompt,
        JSON.stringify({
          detectedPatterns: [{
            pattern: 'string',
            confidence: 'high | medium | low',
            evidence: ['string'],
            description: 'string'
          }],
          primaryArchitecture: 'string',
          architecturalStyle: 'string',
          reasoning: 'string'
        }),
        'You are an expert software architect analyzing repository structure to identify architectural patterns. Focus on file organization, naming conventions, and directory structures to detect common architectural patterns.'
      );
      
      // Extract pattern names for compatibility with existing code
      const patterns = response.detectedPatterns
        .filter(p => p.confidence === 'high' || p.confidence === 'medium')
        .map(p => p.pattern);
      
      logInfo('AI detected architectural patterns', { 
        patterns,
        primaryArchitecture: response.primaryArchitecture,
        reasoning: response.reasoning.substring(0, 200)
      });
      
      return patterns;
      
    } catch (error) {
      logError('AI pattern detection failed', error as Error);
      throw error;
    }
  }
  
  private createPatternDetectionPrompt(fileStructureJson: any, repositoryAnalysis: any): string {
    return `
Analyze this repository's file structure to identify architectural patterns:

## Repository Context
- Name: ${repositoryAnalysis.repository.name}
- Language: ${repositoryAnalysis.repository.language}
- Description: ${repositoryAnalysis.repository.description || 'No description'}
- Project Type: ${repositoryAnalysis.summary.projectType}

## File Structure Analysis
${JSON.stringify(fileStructureJson, null, 2)}

## Your Task
Examine the directory structure, file organization, and naming patterns to identify architectural patterns. Consider:

### Common Architectural Patterns to Look For:
1. **MVC (Model-View-Controller)**: Look for separate directories/files for models, views, and controllers
2. **Layered Architecture**: Look for layers like presentation, business, data, service layers
3. **Microservices**: Look for service-oriented directory structure, Docker files, independent services
4. **Component-Based**: Look for component directories, modular file organization
5. **Domain-Driven Design**: Look for domain-specific directories, aggregates, entities
6. **Hexagonal/Clean Architecture**: Look for adapters, ports, core business logic separation
7. **Event-Driven**: Look for event handlers, publishers, subscribers, message queues
8. **Plugin-Based**: Look for plugin directories, extension points, modular architecture
9. **Monolithic**: Look for single deployable unit with shared dependencies
10. **Modular Monolith**: Look for feature-based modules within single deployment

### Analysis Criteria:
- **Directory naming conventions** (controllers/, models/, services/, components/)
- **File naming patterns** (*.controller.js, *.service.ts, *.component.tsx)
- **Separation of concerns** evident in file organization
- **Dependency patterns** based on file locations
- **Configuration files** that indicate architectural choices
- **Build and deployment structure** (Docker, microservice configs)

For each detected pattern, provide:
- **Pattern name** (use standard architectural pattern names)
- **Confidence level** (high/medium/low based on evidence strength)
- **Evidence** (specific directories, files, or naming patterns that support this)
- **Description** (how this pattern manifests in the codebase)

Also determine:
- **Primary architecture** (the main architectural approach)
- **Architectural style** (overall design philosophy)
- **Reasoning** (why you classified it this way)

Focus on what the file structure actually shows, not what you might expect based on technology stack.
`;
  }

  private analyzeStructuralPatterns(fileStructure: FileStructure): string[] {
    const patterns: string[] = [];
    
    // Check for MVC pattern
    const hasControllers = fileStructure.files.some(f => 
      f.path.toLowerCase().includes('controller') || 
      f.path.toLowerCase().includes('handlers')
    );
    const hasModels = fileStructure.files.some(f => 
      f.path.toLowerCase().includes('model') || 
      f.path.toLowerCase().includes('entity')
    );
    const hasViews = fileStructure.files.some(f => 
      f.path.toLowerCase().includes('view') || 
      f.path.toLowerCase().includes('template')
    );
    
    if (hasControllers && hasModels && hasViews) {
      patterns.push('MVC');
    }
    
    // Check for layered architecture
    const hasLayers = fileStructure.files.some(f => 
      f.path.toLowerCase().includes('service') || 
      f.path.toLowerCase().includes('repository') ||
      f.path.toLowerCase().includes('dao')
    );
    
    if (hasLayers) {
      patterns.push('Layered');
    }
    
    // Check for microservices indicators
    const hasDockerfiles = fileStructure.files.some(f => 
      f.name.toLowerCase() === 'dockerfile' || 
      f.name.toLowerCase() === 'docker-compose.yml'
    );
    const hasMultipleServices = fileStructure.files.some(f => 
      f.path.toLowerCase().includes('service') && 
      f.path.split('/').length > 2
    );
    
    if (hasDockerfiles || hasMultipleServices) {
      patterns.push('Microservices');
    }
    
    // Check for component-based architecture
    const hasComponents = fileStructure.files.some(f => 
      f.path.toLowerCase().includes('component') || 
      f.path.toLowerCase().includes('module')
    );
    
    if (hasComponents) {
      patterns.push('Component-Based');
    }
    
    return patterns;
  }

  private async inferTechStack(fileStructure: FileStructure): Promise<TechStack> {
    const techStack: TechStack = {
      language: 'Unknown',
      frameworks: [],
      libraries: [],
      databases: [],
      tools: [],
      buildSystem: undefined,
      packageManager: undefined
    };
    
    // Analyze dependency files
    const packageJson = fileStructure.files.find(f => f.name === 'package.json');
    const pomXml = fileStructure.files.find(f => f.name === 'pom.xml');
    const requirements = fileStructure.files.find(f => f.name === 'requirements.txt');
    const gemfile = fileStructure.files.find(f => f.name === 'Gemfile');
    const cargoToml = fileStructure.files.find(f => f.name === 'Cargo.toml');
    
    if (packageJson && packageJson.content) {
      this.analyzePackageJson(packageJson.content, techStack);
    }
    
    if (pomXml && pomXml.content) {
      this.analyzePomXml(pomXml.content, techStack);
    }
    
    if (requirements && requirements.content) {
      this.analyzeRequirements(requirements.content, techStack);
    }
    
    if (gemfile && gemfile.content) {
      this.analyzeGemfile(gemfile.content, techStack);
    }
    
    if (cargoToml && cargoToml.content) {
      this.analyzeCargoToml(cargoToml.content, techStack);
    }
    
    // Infer language from file extensions
    if (techStack.language === 'Unknown') {
      techStack.language = this.inferLanguageFromFiles(fileStructure);
    }
    
    return techStack;
  }

  private analyzePackageJson(content: string, techStack: TechStack): void {
    try {
      const packageData = JSON.parse(content);
      techStack.language = 'JavaScript/TypeScript';
      techStack.packageManager = 'npm';
      
      const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
      
      Object.keys(dependencies).forEach(dep => {
        if (dep.includes('react')) techStack.frameworks.push('React');
        if (dep.includes('vue')) techStack.frameworks.push('Vue.js');
        if (dep.includes('angular')) techStack.frameworks.push('Angular');
        if (dep.includes('express')) techStack.frameworks.push('Express.js');
        if (dep.includes('next')) techStack.frameworks.push('Next.js');
        if (dep.includes('nuxt')) techStack.frameworks.push('Nuxt.js');
        if (dep.includes('webpack')) techStack.tools.push('Webpack');
        if (dep.includes('vite')) techStack.tools.push('Vite');
        if (dep.includes('typescript')) techStack.tools.push('TypeScript');
        if (dep.includes('jest')) techStack.tools.push('Jest');
        if (dep.includes('mongodb')) techStack.databases.push('MongoDB');
        if (dep.includes('mysql')) techStack.databases.push('MySQL');
        if (dep.includes('postgres')) techStack.databases.push('PostgreSQL');
      });
    } catch (error) {
      logError('Failed to parse package.json', error as Error);
    }
  }

  private analyzePomXml(content: string, techStack: TechStack): void {
    techStack.language = 'Java';
    techStack.packageManager = 'Maven';
    techStack.buildSystem = 'Maven';
    
    if (content.includes('spring-boot')) techStack.frameworks.push('Spring Boot');
    if (content.includes('springframework')) techStack.frameworks.push('Spring Framework');
    if (content.includes('hibernate')) techStack.frameworks.push('Hibernate');
    if (content.includes('junit')) techStack.tools.push('JUnit');
    if (content.includes('mysql')) techStack.databases.push('MySQL');
    if (content.includes('postgresql')) techStack.databases.push('PostgreSQL');
  }

  private analyzeRequirements(content: string, techStack: TechStack): void {
    techStack.language = 'Python';
    techStack.packageManager = 'pip';
    
    if (content.includes('django')) techStack.frameworks.push('Django');
    if (content.includes('flask')) techStack.frameworks.push('Flask');
    if (content.includes('fastapi')) techStack.frameworks.push('FastAPI');
    if (content.includes('pytest')) techStack.tools.push('pytest');
    if (content.includes('sqlalchemy')) techStack.libraries.push('SQLAlchemy');
  }

  private analyzeGemfile(content: string, techStack: TechStack): void {
    techStack.language = 'Ruby';
    techStack.packageManager = 'bundler';
    
    if (content.includes('rails')) techStack.frameworks.push('Ruby on Rails');
    if (content.includes('sinatra')) techStack.frameworks.push('Sinatra');
    if (content.includes('rspec')) techStack.tools.push('RSpec');
  }

  private analyzeCargoToml(content: string, techStack: TechStack): void {
    techStack.language = 'Rust';
    techStack.packageManager = 'cargo';
    techStack.buildSystem = 'cargo';
    
    if (content.includes('actix-web')) techStack.frameworks.push('Actix Web');
    if (content.includes('rocket')) techStack.frameworks.push('Rocket');
    if (content.includes('tokio')) techStack.frameworks.push('Tokio');
  }

  private inferLanguageFromFiles(fileStructure: FileStructure): string {
    const extensions = fileStructure.files
      .filter(f => f.extension)
      .map(f => f.extension!.toLowerCase());
    
    const counts = extensions.reduce((acc, ext) => {
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (!mostCommon) return 'Unknown';
    
    const langMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'JavaScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cs': 'C#',
      'cpp': 'C++',
      'c': 'C',
      'go': 'Go',
      'rs': 'Rust',
      'php': 'PHP',
      'rb': 'Ruby',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'dart': 'Dart'
    };
    
    return langMap[mostCommon[0]] || 'Unknown';
  }

  private async identifyComponents(fileStructure: FileStructure): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    
    // Group files by directory structure
    const directories = new Map<string, FileInfo[]>();
    
    fileStructure.files.forEach(file => {
      const dir = file.path.split('/').slice(0, -1).join('/') || 'root';
      if (!directories.has(dir)) {
        directories.set(dir, []);
      }
      directories.get(dir)!.push(file);
    });
    
    // Analyze each directory as a potential component
    for (const [dirPath, files] of directories) {
      if (files.length > 1 && dirPath !== 'root') {
        const component = this.analyzeDirectoryAsComponent(dirPath, files);
        if (component) {
          components.push(component);
        }
      }
    }
    
    return components;
  }

  private analyzeDirectoryAsComponent(dirPath: string, files: FileInfo[]): ComponentInfo | null {
    const dirName = dirPath.split('/').pop() || dirPath;
    
    // Skip common non-component directories
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'logs', 'tmp', 'temp'];
    if (skipDirs.some(skip => dirPath.includes(skip))) {
      return null;
    }
    
    const component: ComponentInfo = {
      name: dirName,
      type: this.inferComponentType(dirName, files),
      files: files.map(f => f.path),
      dependencies: []
    };
    
    return component;
  }

  private inferComponentType(dirName: string, files: FileInfo[]): ComponentInfo['type'] {
    const lowerName = dirName.toLowerCase();
    
    if (lowerName.includes('controller') || lowerName.includes('handler')) return 'controller';
    if (lowerName.includes('service')) return 'service';
    if (lowerName.includes('model') || lowerName.includes('entity')) return 'model';
    if (lowerName.includes('util') || lowerName.includes('helper')) return 'utility';
    if (lowerName.includes('config')) return 'config';
    
    // Check file types
    const hasControllers = files.some(f => f.name.toLowerCase().includes('controller'));
    const hasServices = files.some(f => f.name.toLowerCase().includes('service'));
    const hasModels = files.some(f => f.name.toLowerCase().includes('model'));
    
    if (hasControllers) return 'controller';
    if (hasServices) return 'service';
    if (hasModels) return 'model';
    
    return 'other';
  }

  private identifyEntryPoints(fileStructure: FileStructure): EntryPoint[] {
    const entryPoints: EntryPoint[] = [];
    
    const entryPointPatterns = [
      { pattern: /^main\./i, type: 'main' as const },
      { pattern: /^index\./i, type: 'main' as const },
      { pattern: /^app\./i, type: 'main' as const },
      { pattern: /^server\./i, type: 'api' as const },
      { pattern: /^cli\./i, type: 'cli' as const },
      { pattern: /^bin\//i, type: 'cli' as const },
      { pattern: /package\.json$/i, type: 'main' as const },
      { pattern: /dockerfile$/i, type: 'other' as const }
    ];
    
    fileStructure.files.forEach(file => {
      for (const { pattern, type } of entryPointPatterns) {
        if (pattern.test(file.path) || pattern.test(file.name)) {
          entryPoints.push({
            file: file.path,
            type,
            description: this.getEntryPointDescription(file, type)
          });
          break;
        }
      }
    });
    
    return entryPoints;
  }

  private getEntryPointDescription(file: FileInfo, type: EntryPoint['type']): string {
    switch (type) {
      case 'main': return `Main application entry point: ${file.name}`;
      case 'api': return `API server entry point: ${file.name}`;
      case 'cli': return `Command line interface: ${file.name}`;
      case 'web': return `Web application entry: ${file.name}`;
      default: return `Entry point: ${file.name}`;
    }
  }

  private createArchitecturePrompt(state: ArchitectureInferenceState): string {
    const { repositoryAnalysis } = state;
    const { repository, fileStructure, summary } = repositoryAnalysis;
    const { detectedPatterns, techStack, components } = state.metadata;
    
    return `
Analyze the architecture of this repository and provide comprehensive details:

## Repository Overview
Repository: ${repository.name}
Description: ${repository.description || 'No description provided'}
Language: ${repository.language || 'Unknown'}
Project Type: ${summary.projectType}
Complexity: ${summary.complexity}

## File Analysis
- Total files: ${fileStructure.totalFiles}
- Source files: ${fileStructure.categories.source?.length || 0}
- Config files: ${fileStructure.categories.config?.length || 0}
- Test files: ${fileStructure.categories.test?.length || 0}
- Documentation files: ${fileStructure.categories.documentation?.length || 0}

## Technical Stack
- Language: ${techStack?.language || 'Unknown'}
- Frameworks: ${techStack?.frameworks?.join(', ') || 'None'}
- Tools: ${techStack?.tools?.join(', ') || 'None'}

## Detected Patterns
${detectedPatterns?.join(', ') || 'None'}

## Components Identified
${components?.length || 0} components found

## Required Analysis
Provide a comprehensive architecture analysis with:

1. **Architecture Type**: Determine if this is monolith, microservices, layered, modular, or unknown
2. **Architectural Style**: Detailed description of the architectural approach and design philosophy
3. **Application Layers**: List all architectural layers present (e.g., presentation, business, data, etc.)
4. **Design Patterns**: Identify specific patterns used (MVC, Repository, Factory, etc.)
5. **Complexity Assessment**: Overall complexity level with justification
6. **File Analysis**: Provide exact counts and explain significance of file distribution
7. **Architecture Details**: 
   - Strengths of current architecture
   - Weaknesses and technical debt
   - Risk factors for modernization
   - Priority level for modernization (low/medium/high)
8. **Modernization Recommendations**: Specific, actionable steps for legacy modernization
9. **Migration Complexity**: Assessment of migration difficulty with reasoning

Focus on providing concrete, actionable insights based on the file structure and technology stack.
    `;
  }

  private createSimplifiedArchitecturePrompt(state: ArchitectureInferenceState): string {
    const { repositoryAnalysis } = state;
    const { repository, fileStructure, summary } = repositoryAnalysis;
    const { techStack } = state.metadata;
    
    return `
Analyze this repository concisely:

## Repository
- Name: ${repository.name}
- Language: ${repository.language || 'Unknown'}
- Type: ${summary.projectType}
- Complexity: ${summary.complexity}

## File Breakdown
- Total: ${fileStructure.totalFiles} files
- Source: ${fileStructure.categories.source?.length || 0}
- Config: ${fileStructure.categories.config?.length || 0}
- Tests: ${fileStructure.categories.test?.length || 0}

## Tech Stack
${techStack?.language || 'Unknown'} ${techStack?.frameworks?.join(', ') || ''}

Provide structured analysis with:
- Architecture type and brief style description
- Main layers and patterns
- File analysis with counts and key files
- Architecture strengths, weaknesses, and risk factors
- Modernization priority and top 3 recommendations
- Migration complexity assessment

Keep responses concise but comprehensive.
    `;
  }

  async analyze(repositoryAnalysis: RepositoryAnalysis): Promise<ArchitectureAnalysis> {
    const startTime = Date.now();
    
    // Log exact input to Agent 2
    const inputId = await logAgent2Input(repositoryAnalysis);
    
    try {
      let state: ArchitectureInferenceState = {
        repositoryAnalysis,
        currentStep: 'init',
        progress: 0,
        errors: [],
        metadata: {}
      };

      // Execute workflow steps sequentially
      state = await this.detectArchitecturePatterns(state);
      if (state.errors.length > 0) {
        throw new Error(`Pattern detection failed: ${state.errors.join(', ')}`);
      }

      state = await this.analyzeTechStack(state);
      if (state.errors.length > 0) {
        throw new Error(`Tech stack analysis failed: ${state.errors.join(', ')}`);
      }

      state = await this.inferComponents(state);
      if (state.errors.length > 0) {
        throw new Error(`Component inference failed: ${state.errors.join(', ')}`);
      }

      state = await this.generateArchitectureAnalysis(state);
      if (state.errors.length > 0) {
        throw new Error(`Architecture analysis failed: ${state.errors.join(', ')}`);
      }
      
      if (!state.architectureAnalysis) {
        throw new Error('Architecture analysis not completed');
      }
      
      // Calculate execution time
      const executionTime = (Date.now() - startTime) / 1000;
      
      // Log exact output from Agent 2
      await logAgent2Output(state.architectureAnalysis, inputId, executionTime);
      
      // Log comparison between input and output
      await agentIOLogger.logComparison('Architecture Inference Agent', 'analyze', repositoryAnalysis, state.architectureAnalysis);
      
      return state.architectureAnalysis;
    } catch (error) {
      // Calculate execution time for error
      const executionTime = (Date.now() - startTime) / 1000;
      
      // Log error with input context
      await logAgent2Error(error as Error, inputId, executionTime);
      
      logError('Architecture inference failed', error as Error);
      throw error;
    }
  }
}

export default ArchitectureInferenceAgent;