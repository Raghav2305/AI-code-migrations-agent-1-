import { 
  CodeFlowAnalysis, 
  RepositoryAnalysis, 
  ArchitectureAnalysis,
  CodeFlowInfo,
  DependencyInfo,
  DataFlowInfo,
  ExecutionPath,
  CodeEntryPoint,
  CallGraph,
  ModuleInteraction,
  InternalDependency,
  ExternalDependency,
  CircularDependency,
  DataStream,
  DataStore,
  DataTransformation,
  DataBottleneck,
  FileInfo
} from '../../shared/types';
import { LLMClient } from '../../shared/utils/llm-client';
import { logInfo, logError } from '../../shared/utils/logger';

interface CodeFlowState {
  repositoryAnalysis: RepositoryAnalysis;
  architectureAnalysis: ArchitectureAnalysis;
  codeFlowAnalysis?: CodeFlowAnalysis;
  currentStep: string;
  progress: number;
  errors: string[];
  metadata: Record<string, any>;
}

export class CodeFlowAgent {
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient({ provider: 'gemini' });
  }

  private async analyzeEntryPoints(state: CodeFlowState): Promise<CodeFlowState> {
    try {
      logInfo('Analyzing code entry points');
      
      const { repositoryAnalysis, architectureAnalysis } = state;
      const sourceFiles = repositoryAnalysis.fileStructure.categories.source || [];
      
      // Analyze entry points using LLM
      const entryPointsPrompt = this.createEntryPointsPrompt(repositoryAnalysis, architectureAnalysis, sourceFiles);
      
      const entryPointsResponse = await this.llmClient.generateStructuredResponse<{
        entryPoints: CodeEntryPoint[];
        mainEntryPoint: string;
        analysisNotes: string;
      }>(
        entryPointsPrompt,
        JSON.stringify({
          entryPoints: [{
            file: 'string',
            function: 'string',
            type: 'main | api_endpoint | event_handler | cli_command | other',
            parameters: ['string'],
            returnType: 'string',
            description: 'string',
            callsTo: ['string']
          }],
          mainEntryPoint: 'string',
          analysisNotes: 'string'
        }),
        'You are an expert code analyst specialized in identifying application entry points and execution flows.'
      );

      return {
        ...state,
        currentStep: 'analyze_execution_paths',
        progress: 20,
        metadata: {
          ...state.metadata,
          entryPoints: entryPointsResponse.entryPoints,
          mainEntryPoint: entryPointsResponse.mainEntryPoint,
          entryPointsNotes: entryPointsResponse.analysisNotes
        }
      };
    } catch (error) {
      logError('Entry points analysis failed', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Entry points analysis failed: ${(error as Error).message}`],
        currentStep: 'analyze_execution_paths',
        progress: 20
      };
    }
  }

  private async analyzeExecutionPaths(state: CodeFlowState): Promise<CodeFlowState> {
    try {
      logInfo('Analyzing execution paths');
      
      const { repositoryAnalysis, architectureAnalysis } = state;
      const entryPoints = state.metadata.entryPoints || [];
      
      // Check if we have enough data to proceed
      if (entryPoints.length === 0) {
        logInfo('No entry points found, creating minimal execution path analysis');
        return {
          ...state,
          currentStep: 'analyze_dependencies',
          progress: 40,
          metadata: {
            ...state.metadata,
            executionPaths: [],
            callGraphs: [],
            moduleInteractions: [],
            cyclomaticComplexity: 0,
            flowPatterns: []
          }
        };
      }

      // Create a simplified prompt for execution paths
      const executionPathsPrompt = this.createSimplifiedExecutionPathsPrompt(repositoryAnalysis, architectureAnalysis, entryPoints);
      
      // Try with a simpler schema first
      let executionPathsResponse;
      try {
        executionPathsResponse = await this.llmClient.generateStructuredResponse<{
          executionPaths: ExecutionPath[];
          callGraphs: CallGraph[];
          moduleInteractions: ModuleInteraction[];
          cyclomaticComplexity: number;
          flowPatterns: string[];
        }>(
          executionPathsPrompt,
          JSON.stringify({
            executionPaths: [{
              id: 'string',
              name: 'string',
              type: 'main | api | event | batch | other',
              startPoint: 'string',
              endPoint: 'string',
              steps: [{
                id: 'string',
                file: 'string',
                function: 'string',
                lineNumber: 'number',
                type: 'function_call | method_call | condition | loop | return | other',
                description: 'string',
                dependencies: ['string']
              }],
              complexity: 'low | medium | high',
              description: 'string'
            }],
            callGraphs: [{
              function: 'string',
              file: 'string',
              calls: [{
                function: 'string',
                file: 'string',
                type: 'direct | indirect | conditional | async',
                frequency: 'low | medium | high'
              }],
              calledBy: [{
                function: 'string',
                file: 'string',
                type: 'direct | indirect | conditional | async',
                frequency: 'low | medium | high'
              }],
              complexity: 'number'
            }],
            moduleInteractions: [{
              sourceModule: 'string',
              targetModule: 'string',
              interactionType: 'import | api_call | event | data_flow | other',
              strength: 'weak | medium | strong',
              description: 'string'
            }],
            cyclomaticComplexity: 'number',
            flowPatterns: ['string']
          }),
          'You are an expert code analyst specialized in tracing execution paths and call graphs.'
        );
      } catch (error) {
        logError('Detailed execution paths analysis failed, using minimal approach', error as Error);
        
        // Fallback to minimal analysis
        executionPathsResponse = {
          executionPaths: entryPoints.map((ep: CodeEntryPoint, index: number) => ({
            id: `path_${index}`,
            name: `${ep.function} execution path`,
            type: (ep.type === 'main' ? 'main' : 'other') as 'main' | 'api' | 'event' | 'batch' | 'other',
            startPoint: ep.file,
            endPoint: ep.file,
            steps: [{
              id: `step_${index}`,
              file: ep.file,
              function: ep.function,
              lineNumber: 1,
              type: 'function_call' as 'function_call' | 'method_call' | 'condition' | 'loop' | 'return' | 'other',
              description: `Entry point: ${ep.function}`,
              dependencies: []
            }],
            complexity: 'medium' as 'low' | 'medium' | 'high',
            description: `Basic execution path for ${ep.function}`
          })),
          callGraphs: [],
          moduleInteractions: [],
          cyclomaticComplexity: Math.min(entryPoints.length * 2, 10),
          flowPatterns: ['sequential']
        };
      }

      return {
        ...state,
        currentStep: 'analyze_dependencies',
        progress: 40,
        metadata: {
          ...state.metadata,
          executionPaths: executionPathsResponse.executionPaths,
          callGraphs: executionPathsResponse.callGraphs,
          moduleInteractions: executionPathsResponse.moduleInteractions,
          cyclomaticComplexity: executionPathsResponse.cyclomaticComplexity,
          flowPatterns: executionPathsResponse.flowPatterns
        }
      };
    } catch (error) {
      logError('Execution paths analysis failed', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Execution paths analysis failed: ${(error as Error).message}`],
        currentStep: 'analyze_dependencies',
        progress: 40
      };
    }
  }

  private async analyzeDependencies(state: CodeFlowState): Promise<CodeFlowState> {
    try {
      logInfo('Analyzing dependencies');
      
      const { repositoryAnalysis, architectureAnalysis } = state;
      
      // Create a simplified prompt for dependencies
      const dependenciesPrompt = this.createSimplifiedDependenciesPrompt(repositoryAnalysis, architectureAnalysis);
      
      let dependenciesResponse;
      try {
        dependenciesResponse = await this.llmClient.generateStructuredResponse<{
          internal: InternalDependency[];
          external: ExternalDependency[];
          circular: CircularDependency[];
          riskLevel: 'low' | 'medium' | 'high';
          analysisNotes: string;
        }>(
          dependenciesPrompt,
          JSON.stringify({
            internal: [{
              source: 'string',
              target: 'string',
              type: 'import | require | include | reference',
              strength: 'weak | medium | strong',
              isCircular: 'boolean'
            }],
            external: [{
              name: 'string',
              version: 'string',
              type: 'runtime | development | peer | optional',
              usageCount: 'number',
              riskLevel: 'low | medium | high',
              alternatives: ['string']
            }],
            circular: [{
              id: 'string',
              cycle: ['string'],
              severity: 'low | medium | high',
              description: 'string',
              suggestions: ['string']
            }],
            riskLevel: 'low | medium | high',
            analysisNotes: 'string'
          }),
          'You are an expert code analyst specialized in dependency analysis and circular dependency detection.'
        );
      } catch (error) {
        logError('Detailed dependencies analysis failed, using minimal approach', error as Error);
        
        // Fallback to minimal analysis
        const sourceFiles = repositoryAnalysis.fileStructure.categories.source || [];
        dependenciesResponse = {
          internal: sourceFiles.slice(0, 10).map((file: FileInfo, index: number) => ({
            source: file.path,
            target: sourceFiles[Math.min(index + 1, sourceFiles.length - 1)].path,
            type: 'import' as 'import' | 'require' | 'include' | 'reference',
            strength: 'medium' as 'weak' | 'medium' | 'strong',
            isCircular: false
          })),
          external: [],
          circular: [],
          riskLevel: 'medium' as 'low' | 'medium' | 'high',
          analysisNotes: 'Minimal dependency analysis due to LLM limitations'
        };
      }

      return {
        ...state,
        currentStep: 'analyze_data_flow',
        progress: 60,
        metadata: {
          ...state.metadata,
          internalDependencies: dependenciesResponse.internal,
          externalDependencies: dependenciesResponse.external,
          circularDependencies: dependenciesResponse.circular,
          dependencyRiskLevel: dependenciesResponse.riskLevel,
          dependencyNotes: dependenciesResponse.analysisNotes
        }
      };
    } catch (error) {
      logError('Dependencies analysis failed', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Dependencies analysis failed: ${(error as Error).message}`],
        currentStep: 'analyze_data_flow',
        progress: 60
      };
    }
  }

  private async analyzeDataFlow(state: CodeFlowState): Promise<CodeFlowState> {
    try {
      logInfo('Analyzing data flow');
      
      const { repositoryAnalysis, architectureAnalysis } = state;
      
      // Create a simplified prompt for data flow
      const dataFlowPrompt = this.createSimplifiedDataFlowPrompt(repositoryAnalysis, architectureAnalysis);
      
      let dataFlowResponse;
      try {
        dataFlowResponse = await this.llmClient.generateStructuredResponse<{
          dataStreams: DataStream[];
          dataStores: DataStore[];
          transformations: DataTransformation[];
          flowPatterns: string[];
          bottlenecks: DataBottleneck[];
        }>(
          dataFlowPrompt,
          JSON.stringify({
            dataStreams: [{
              id: 'string',
              name: 'string',
              source: 'string',
              destination: 'string',
              dataType: 'string',
              volume: 'low | medium | high',
              frequency: 'realtime | batch | event | scheduled',
              transformations: ['string']
            }],
            dataStores: [{
              name: 'string',
              type: 'database | cache | file | memory | api | other',
              accessPattern: 'read | write | read_write',
              dataTypes: ['string'],
              connectedComponents: ['string']
            }],
            transformations: [{
              id: 'string',
              name: 'string',
              input: 'string',
              output: 'string',
              transformationType: 'filter | map | reduce | aggregate | format | validate',
              complexity: 'low | medium | high',
              location: 'string'
            }],
            flowPatterns: ['string'],
            bottlenecks: [{
              id: 'string',
              location: 'string',
              type: 'processing | io | network | memory | other',
              severity: 'low | medium | high',
              description: 'string',
              suggestions: ['string']
            }]
          }),
          'You are an expert data flow analyst specialized in tracing data movement and transformations.'
        );
      } catch (error) {
        logError('Detailed data flow analysis failed, using minimal approach', error as Error);
        
        // Fallback to minimal analysis
        dataFlowResponse = {
          dataStreams: [{
            id: 'stream_1',
            name: 'Basic data flow',
            source: 'input',
            destination: 'output',
            dataType: 'mixed',
            volume: 'medium' as 'low' | 'medium' | 'high',
            frequency: 'batch' as 'realtime' | 'batch' | 'event' | 'scheduled',
            transformations: ['basic processing']
          }],
          dataStores: [{
            name: 'Main storage',
            type: 'file' as 'database' | 'cache' | 'file' | 'memory' | 'api' | 'other',
            accessPattern: 'read_write' as 'read' | 'write' | 'read_write',
            dataTypes: ['mixed'],
            connectedComponents: ['main application']
          }],
          transformations: [{
            id: 'transform_1',
            name: 'Basic transformation',
            input: 'raw data',
            output: 'processed data',
            transformationType: 'format' as 'filter' | 'map' | 'reduce' | 'aggregate' | 'format' | 'validate',
            complexity: 'medium' as 'low' | 'medium' | 'high',
            location: 'main module'
          }],
          flowPatterns: ['sequential', 'batch processing'],
          bottlenecks: []
        };
      }

      return {
        ...state,
        currentStep: 'generate_recommendations',
        progress: 80,
        metadata: {
          ...state.metadata,
          dataStreams: dataFlowResponse.dataStreams,
          dataStores: dataFlowResponse.dataStores,
          dataTransformations: dataFlowResponse.transformations,
          dataFlowPatterns: dataFlowResponse.flowPatterns,
          dataBottlenecks: dataFlowResponse.bottlenecks
        }
      };
    } catch (error) {
      logError('Data flow analysis failed', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Data flow analysis failed: ${(error as Error).message}`],
        currentStep: 'generate_recommendations',
        progress: 80
      };
    }
  }

  private async generateRecommendations(state: CodeFlowState): Promise<CodeFlowState> {
    try {
      logInfo('Generating code flow recommendations');
      
      const { repositoryAnalysis, architectureAnalysis } = state;
      
      // Create a simplified prompt for recommendations
      const recommendationsPrompt = this.createSimplifiedRecommendationsPrompt(repositoryAnalysis, architectureAnalysis, state.metadata);
      
      let recommendationsResponse;
      try {
        recommendationsResponse = await this.llmClient.generateStructuredResponse<{
          recommendations: string[];
          complexity: 'low' | 'medium' | 'high';
          priorityActions: string[];
          riskFactors: string[];
        }>(
          recommendationsPrompt,
          JSON.stringify({
            recommendations: ['string'],
            complexity: 'low | medium | high',
            priorityActions: ['string'],
            riskFactors: ['string']
          }),
          'You are an expert code analyst providing actionable recommendations for code flow optimization.'
        );
      } catch (error) {
        logError('Detailed recommendations generation failed, using minimal approach', error as Error);
        
        // Fallback to minimal recommendations
        const circularDeps = state.metadata.circularDependencies || [];
        const entryPoints = state.metadata.entryPoints || [];
        
        recommendationsResponse = {
          recommendations: [
            'Review code organization and modular structure',
            'Consider implementing clearer separation of concerns',
            'Evaluate current dependency management practices',
            'Plan for gradual modernization of legacy components'
          ],
          complexity: (circularDeps.length > 0 ? 'high' : (entryPoints.length > 5 ? 'medium' : 'low')) as 'low' | 'medium' | 'high',
          priorityActions: [
            'Identify and resolve circular dependencies',
            'Improve code documentation',
            'Establish clear module boundaries'
          ],
          riskFactors: [
            'Complex interdependencies',
            'Potential technical debt',
            'Legacy code patterns'
          ]
        };
      }

      return {
        ...state,
        currentStep: 'finalize_analysis',
        progress: 90,
        metadata: {
          ...state.metadata,
          codeFlowRecommendations: recommendationsResponse.recommendations,
          codeFlowComplexity: recommendationsResponse.complexity,
          priorityActions: recommendationsResponse.priorityActions,
          riskFactors: recommendationsResponse.riskFactors
        }
      };
    } catch (error) {
      logError('Code flow recommendations generation failed', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Code flow recommendations generation failed: ${(error as Error).message}`],
        currentStep: 'finalize_analysis',
        progress: 90
      };
    }
  }

  private async finalizeAnalysis(state: CodeFlowState): Promise<CodeFlowState> {
    try {
      logInfo('Finalizing code flow analysis');
      
      const codeFlowInfo: CodeFlowInfo = {
        executionPaths: state.metadata.executionPaths || [],
        entryPoints: state.metadata.entryPoints || [],
        callGraphs: state.metadata.callGraphs || [],
        moduleInteractions: state.metadata.moduleInteractions || [],
        cyclomaticComplexity: state.metadata.cyclomaticComplexity || 0,
        flowPatterns: state.metadata.flowPatterns || []
      };

      const dependencyInfo: DependencyInfo = {
        internal: state.metadata.internalDependencies || [],
        external: state.metadata.externalDependencies || [],
        circular: state.metadata.circularDependencies || [],
        dependencyTree: this.buildDependencyTree(state.metadata.internalDependencies || []),
        riskLevel: state.metadata.dependencyRiskLevel || 'medium'
      };

      const dataFlowInfo: DataFlowInfo = {
        dataStreams: state.metadata.dataStreams || [],
        dataStores: state.metadata.dataStores || [],
        transformations: state.metadata.dataTransformations || [],
        flowPatterns: state.metadata.dataFlowPatterns || [],
        bottlenecks: state.metadata.dataBottlenecks || []
      };

      const codeFlowAnalysis: CodeFlowAnalysis = {
        repository: state.repositoryAnalysis.repository,
        codeFlow: codeFlowInfo,
        dependencies: dependencyInfo,
        dataFlow: dataFlowInfo,
        recommendations: state.metadata.codeFlowRecommendations || [],
        complexity: state.metadata.codeFlowComplexity || 'medium',
        timestamp: new Date().toISOString()
      };

      return {
        ...state,
        codeFlowAnalysis,
        currentStep: 'completed',
        progress: 100
      };
    } catch (error) {
      logError('Code flow analysis finalization failed', error as Error);
      return {
        ...state,
        errors: [...state.errors, `Code flow analysis finalization failed: ${(error as Error).message}`],
        currentStep: 'completed',
        progress: 100
      };
    }
  }

  private buildDependencyTree(dependencies: InternalDependency[]): any[] {
    // Simple dependency tree builder that avoids circular references
    const nodeMap = new Map<string, any>();
    const processedEdges = new Set<string>();
    
    // Create nodes for all files
    dependencies.forEach(dep => {
      if (!nodeMap.has(dep.source)) {
        nodeMap.set(dep.source, {
          name: dep.source,
          type: 'file',
          children: [],
          depth: 0,
          isCircular: dep.isCircular
        });
      }
      if (!nodeMap.has(dep.target)) {
        nodeMap.set(dep.target, {
          name: dep.target,
          type: 'file',
          children: [],
          depth: 0,
          isCircular: dep.isCircular
        });
      }
    });

    // Build relationships while avoiding circular references
    dependencies.forEach(dep => {
      const edgeKey = `${dep.source}->${dep.target}`;
      const reverseEdgeKey = `${dep.target}->${dep.source}`;
      
      // Skip if this would create a circular reference
      if (processedEdges.has(reverseEdgeKey) || dep.isCircular) {
        return;
      }
      
      const sourceNode = nodeMap.get(dep.source);
      const targetNode = nodeMap.get(dep.target);
      if (sourceNode && targetNode) {
        // Instead of adding the full node object, add a reference to avoid circular structure
        sourceNode.children.push({
          name: targetNode.name,
          type: targetNode.type,
          isCircular: targetNode.isCircular
        });
        processedEdges.add(edgeKey);
      }
    });

    return Array.from(nodeMap.values());
  }

  private createEntryPointsPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis, sourceFiles: FileInfo[]): string {
    const { repository, summary } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Analyze the code entry points for this repository:

## Repository Information
- Name: ${repository.name}
- Language: ${repository.language}
- Project Type: ${summary.projectType}
- Architecture Type: ${architecture.type}

## Source Files Analysis
Total source files: ${sourceFiles.length}

Key source files:
${sourceFiles.slice(0, 10).map(file => `- ${file.path} (${file.extension})`).join('\n')}

## Tech Stack
- Language: ${architecture.techStack.language}
- Frameworks: ${architecture.techStack.frameworks.join(', ')}
- Libraries: ${architecture.techStack.libraries.join(', ')}

## Analysis Requirements
Identify and analyze:

1. **Main Entry Points**: Primary application entry points (main, index, app, etc.)
2. **API Endpoints**: Web service endpoints and route handlers
3. **Event Handlers**: Event-driven entry points
4. **CLI Commands**: Command-line interface entry points
5. **Other Entry Points**: Any other significant entry points

For each entry point, provide:
- File location and function name
- Entry point type and purpose
- Parameters and return types
- Functions/methods it calls
- Brief description of its role

Focus on identifying the most critical entry points that control application flow.
    `;
  }

  private createSimplifiedExecutionPathsPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis, entryPoints: CodeEntryPoint[]): string {
    const { repository, summary } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Analyze execution paths for this repository (simplified):

## Repository: ${repository.name}
- Language: ${repository.language}
- Type: ${summary.projectType}
- Architecture: ${architecture.type}

## Entry Points (${entryPoints.length}):
${entryPoints.slice(0, 5).map(ep => `- ${ep.function} in ${ep.file} (${ep.type})`).join('\n')}

## Task:
Provide a basic analysis of execution paths and call relationships.

Focus on:
1. Main execution flows from entry points
2. Basic call relationships
3. Simple complexity assessment
4. Common flow patterns

Keep the analysis concise and focused on the most important paths.
    `;
  }

  private createExecutionPathsPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis, entryPoints: CodeEntryPoint[]): string {
    const { repository, summary } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Analyze execution paths and call graphs for this repository:

## Repository Information
- Name: ${repository.name}
- Language: ${repository.language}
- Architecture Type: ${architecture.type}
- Complexity: ${summary.complexity}

## Identified Entry Points
${entryPoints.map(ep => `- ${ep.function} in ${ep.file} (${ep.type})`).join('\n')}

## Architecture Layers
${architecture.layers.join(', ')}

## Analysis Requirements
Trace and analyze:

1. **Execution Paths**: Major execution flows from entry points
2. **Call Graphs**: Function call relationships and dependencies
3. **Module Interactions**: How different modules communicate
4. **Cyclomatic Complexity**: Overall code complexity metrics
5. **Flow Patterns**: Common execution patterns used

For each execution path:
- Start and end points
- Key execution steps with file/function locations
- Complexity assessment
- Dependencies and interactions

For call graphs:
- Function relationships (who calls whom)
- Call frequency and type (direct, indirect, conditional, async)
- Complexity metrics

Focus on identifying the most critical execution flows and potential bottlenecks.
    `;
  }

  private createSimplifiedDependenciesPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis): string {
    const { repository, fileStructure } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Analyze dependencies for this repository (simplified):

## Repository: ${repository.name}
- Language: ${repository.language}
- Total Files: ${fileStructure.totalFiles}
- Architecture: ${architecture.type}

## File Structure:
- Source files: ${fileStructure.categories.source?.length || 0}
- Config files: ${fileStructure.categories.config?.length || 0}

## Task:
Provide a basic dependency analysis focusing on:
1. Key internal file dependencies
2. Major external dependencies
3. Potential circular dependencies
4. Overall risk assessment

Keep the analysis concise and focus on the most important dependencies.
    `;
  }

  private createDependenciesPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis): string {
    const { repository, fileStructure } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Analyze dependencies for this repository:

## Repository Information
- Name: ${repository.name}
- Language: ${repository.language}
- Total Files: ${fileStructure.totalFiles}

## Architecture Information
- Type: ${architecture.type}
- Tech Stack: ${architecture.techStack.frameworks.join(', ')}
- Libraries: ${architecture.techStack.libraries.join(', ')}

## File Structure
- Source files: ${fileStructure.categories.source?.length || 0}
- Config files: ${fileStructure.categories.config?.length || 0}

## Analysis Requirements
Analyze and identify:

1. **Internal Dependencies**: File-to-file dependencies within the codebase
2. **External Dependencies**: Third-party libraries and packages
3. **Circular Dependencies**: Problematic circular reference patterns
4. **Dependency Risk Assessment**: Overall risk level of dependencies

For internal dependencies:
- Source and target files
- Dependency type (import, require, include, reference)
- Strength of coupling
- Circular dependency detection

For external dependencies:
- Package names and versions
- Usage frequency and importance
- Risk assessment (outdated, vulnerable, unmaintained)
- Alternative suggestions

For circular dependencies:
- Identify cycles and their severity
- Provide suggestions for breaking cycles

Focus on identifying dependency issues that could impact modernization efforts.
    `;
  }

  private createSimplifiedDataFlowPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis): string {
    const { repository, summary } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Analyze data flow for this repository (simplified):

## Repository: ${repository.name}
- Language: ${repository.language}
- Type: ${summary.projectType}
- Architecture: ${architecture.type}

## Task:
Provide a basic data flow analysis focusing on:
1. Main data streams and flow patterns
2. Key data storage mechanisms
3. Basic data transformations
4. Potential bottlenecks

Keep the analysis concise and focus on the most important data flows.
    `;
  }

  private createDataFlowPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis): string {
    const { repository, summary } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Analyze data flow for this repository:

## Repository Information
- Name: ${repository.name}
- Language: ${repository.language}
- Project Type: ${summary.projectType}
- Architecture Type: ${architecture.type}

## Architecture Components
- Components: ${architecture.components.length}
- Tech Stack: ${architecture.techStack.language}, ${architecture.techStack.frameworks.join(', ')}

## Analysis Requirements
Analyze and identify:

1. **Data Streams**: How data moves through the application
2. **Data Stores**: Where data is stored and accessed
3. **Data Transformations**: How data is processed and transformed
4. **Flow Patterns**: Common data flow patterns
5. **Bottlenecks**: Performance bottlenecks in data processing

For data streams:
- Source and destination
- Data types and volume
- Processing frequency
- Transformations applied

For data stores:
- Storage type (database, cache, file, memory)
- Access patterns (read/write)
- Connected components

For transformations:
- Input/output types
- Transformation logic
- Complexity assessment

Focus on identifying data flow issues that could impact performance and scalability.
    `;
  }

  private createSimplifiedRecommendationsPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis, metadata: Record<string, any>): string {
    const { repository, summary } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Generate code flow recommendations for this repository (simplified):

## Repository: ${repository.name}
- Language: ${repository.language}
- Type: ${summary.projectType}
- Architecture: ${architecture.type}

## Analysis Summary:
- Entry Points: ${metadata.entryPoints?.length || 0}
- Circular Dependencies: ${metadata.circularDependencies?.length || 0}
- Complexity: ${architecture.complexity}

## Task:
Provide actionable recommendations for:
1. Code flow optimization
2. Dependency management
3. Architecture improvements
4. Priority actions for modernization

Keep recommendations practical and focused on the most impactful improvements.
    `;
  }

  private createRecommendationsPrompt(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis, metadata: Record<string, any>): string {
    const { repository, summary } = repositoryAnalysis;
    const { architecture } = architectureAnalysis;
    
    return `
Generate code flow optimization recommendations for this repository:

## Repository Information
- Name: ${repository.name}
- Language: ${repository.language}
- Project Type: ${summary.projectType}
- Architecture Type: ${architecture.type}

## Code Flow Analysis Results
- Entry Points: ${metadata.entryPoints?.length || 0}
- Execution Paths: ${metadata.executionPaths?.length || 0}
- Cyclomatic Complexity: ${metadata.cyclomaticComplexity || 0}
- Circular Dependencies: ${metadata.circularDependencies?.length || 0}
- Data Bottlenecks: ${metadata.dataBottlenecks?.length || 0}

## Architecture Context
- Complexity: ${architecture.complexity}
- Patterns: ${architecture.patterns.join(', ')}
- Components: ${architecture.components.length}

## Recommendation Requirements
Provide actionable recommendations for:

1. **Code Flow Optimization**: Improve execution paths and reduce complexity
2. **Dependency Management**: Resolve circular dependencies and reduce coupling
3. **Data Flow Efficiency**: Optimize data processing and eliminate bottlenecks
4. **Architecture Improvements**: Enhance overall code organization
5. **Performance Optimization**: Identify and fix performance issues

Focus on:
- Specific, actionable recommendations
- Prioritized list of improvements
- Risk assessment for each recommendation
- Expected impact and effort estimation

Provide recommendations that support legacy modernization goals.
    `;
  }

  async analyze(repositoryAnalysis: RepositoryAnalysis, architectureAnalysis: ArchitectureAnalysis): Promise<CodeFlowAnalysis> {
    try {
      let state: CodeFlowState = {
        repositoryAnalysis,
        architectureAnalysis,
        currentStep: 'analyze_entry_points',
        progress: 0,
        errors: [],
        metadata: {}
      };

      // Execute workflow steps sequentially
      state = await this.analyzeEntryPoints(state);
      if (state.errors.length > 0) {
        throw new Error(`Entry points analysis failed: ${state.errors.join(', ')}`);
      }

      state = await this.analyzeExecutionPaths(state);
      if (state.errors.length > 0) {
        throw new Error(`Execution paths analysis failed: ${state.errors.join(', ')}`);
      }

      state = await this.analyzeDependencies(state);
      if (state.errors.length > 0) {
        throw new Error(`Dependencies analysis failed: ${state.errors.join(', ')}`);
      }

      state = await this.analyzeDataFlow(state);
      if (state.errors.length > 0) {
        throw new Error(`Data flow analysis failed: ${state.errors.join(', ')}`);
      }

      state = await this.generateRecommendations(state);
      if (state.errors.length > 0) {
        throw new Error(`Recommendations generation failed: ${state.errors.join(', ')}`);
      }

      state = await this.finalizeAnalysis(state);
      if (state.errors.length > 0) {
        throw new Error(`Analysis finalization failed: ${state.errors.join(', ')}`);
      }
      
      if (!state.codeFlowAnalysis) {
        throw new Error('Code flow analysis failed to produce results');
      }
      
      return state.codeFlowAnalysis;
    } catch (error) {
      logError('Code flow analysis failed', error as Error);
      throw error;
    }
  }
}