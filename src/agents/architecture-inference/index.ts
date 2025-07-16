import { 
  Repository, 
  FileStructure, 
  RepositoryAnalysis,
  ArchitectureAnalysis,
  ArchitectureInfo,
  ComponentInfo,
  EntryPoint,
  TechStack,
  FileInfo
} from '../../shared/types';
import { 
  LLMClient, 
  logInfo, 
  logError 
} from '../../shared/utils';

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
      logInfo('Detecting architecture patterns');
      
      const { fileStructure } = state.repositoryAnalysis;
      const patterns = this.analyzeStructuralPatterns(fileStructure);
      
      return {
        ...state,
        currentStep: 'detect_patterns',
        progress: 25,
        metadata: {
          ...state.metadata,
          detectedPatterns: patterns
        }
      };
    } catch (error) {
      logError('Failed to detect architecture patterns', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Failed to detect patterns: ${(error as Error).message}`],
        currentStep: 'detect_patterns',
        progress: 0
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
      
      const architectureResponse = await this.llmClient.generateStructuredResponse<{
        type: 'monolith' | 'microservices' | 'layered' | 'modular' | 'unknown';
        style: string;
        layers: string[];
        patterns: string[];
        complexity: 'low' | 'medium' | 'high';
        recommendations: string[];
        migrationComplexity: 'low' | 'medium' | 'high';
      }>(
        architecturePrompt,
        JSON.stringify({
          type: 'monolith | microservices | layered | modular | unknown',
          style: 'string',
          layers: ['string'],
          patterns: ['string'],
          complexity: 'low | medium | high',
          recommendations: ['string'],
          migrationComplexity: 'low | medium | high'
        }),
        'You are an expert software architect analyzing repository structure to infer architecture patterns and provide modernization recommendations.'
      );
      
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
Analyze the architecture of this repository:

Repository: ${repository.name}
Description: ${repository.description || 'No description provided'}
Language: ${repository.language || 'Unknown'}
Project Type: ${summary.projectType}
Complexity: ${summary.complexity}

Detected Patterns: ${detectedPatterns?.join(', ') || 'None'}

Tech Stack:
- Language: ${techStack?.language || 'Unknown'}
- Frameworks: ${techStack?.frameworks?.join(', ') || 'None'}
- Tools: ${techStack?.tools?.join(', ') || 'None'}

File Structure:
- Total files: ${fileStructure.totalFiles}
- Source files: ${fileStructure.categories.source?.length || 0}
- Config files: ${fileStructure.categories.config?.length || 0}
- Test files: ${fileStructure.categories.test?.length || 0}

Components: ${components?.length || 0} identified

Based on this analysis, determine:
1. Architecture type (monolith, microservices, layered, modular, unknown)
2. Architectural style description
3. Application layers present
4. Design patterns used
5. Overall complexity assessment
6. Modernization recommendations
7. Migration complexity assessment

Provide specific, actionable recommendations for legacy modernization.
    `;
  }

  async analyze(repositoryAnalysis: RepositoryAnalysis): Promise<ArchitectureAnalysis> {
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
      
      return state.architectureAnalysis;
    } catch (error) {
      logError('Architecture inference failed', error as Error);
      throw error;
    }
  }
}

export default ArchitectureInferenceAgent;