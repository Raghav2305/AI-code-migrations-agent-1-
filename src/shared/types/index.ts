// Core repository types
export interface Repository {
  url: string;
  name: string;
  owner: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  branch: string;
  lastUpdated?: string;
}

// File structure types
export interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  content?: string;
  category?: FileCategory;
}

export type FileCategory = 
  | 'source'
  | 'config'
  | 'documentation'
  | 'test'
  | 'build'
  | 'dependency'
  | 'asset'
  | 'other';

export interface FileStructure {
  totalFiles: number;
  totalDirectories: number;
  files: FileInfo[];
  categories: Record<FileCategory, FileInfo[]>;
  mainFiles: FileInfo[];
}

// Agent 1 output types
export interface RepositoryAnalysis {
  repository: Repository;
  fileStructure: FileStructure;
  summary: {
    purpose: string;
    mainTechnologies: string[];
    projectType: string;
    complexity: 'low' | 'medium' | 'high';
  };
  insights: string[];
  timestamp: string;
}

// Agent 2 output types
export interface ArchitectureInfo {
  type: 'monolith' | 'microservices' | 'layered' | 'modular' | 'unknown';
  style: string;
  layers: string[];
  components: ComponentInfo[];
  entryPoints: EntryPoint[];
  techStack: TechStack;
  patterns: string[];
  complexity: 'low' | 'medium' | 'high';
}

export interface ComponentInfo {
  name: string;
  type: 'service' | 'controller' | 'model' | 'utility' | 'config' | 'other';
  files: string[];
  dependencies: string[];
  description?: string;
}

export interface EntryPoint {
  file: string;
  type: 'main' | 'api' | 'cli' | 'web' | 'other';
  description?: string;
}

export interface TechStack {
  language: string;
  frameworks: string[];
  libraries: string[];
  databases: string[];
  tools: string[];
  buildSystem?: string;
  packageManager?: string;
}

export interface ArchitectureAnalysis {
  repository: Repository;
  architecture: ArchitectureInfo;
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
  timestamp: string;
}

// Agent 3 output types
export interface CodeFlowAnalysis {
  repository: Repository;
  codeFlow: CodeFlowInfo;
  dependencies: DependencyInfo;
  dataFlow: DataFlowInfo;
  recommendations: string[];
  complexity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface CodeFlowInfo {
  executionPaths: ExecutionPath[];
  entryPoints: CodeEntryPoint[];
  callGraphs: CallGraph[];
  moduleInteractions: ModuleInteraction[];
  cyclomaticComplexity: number;
  flowPatterns: string[];
}

export interface ExecutionPath {
  id: string;
  name: string;
  type: 'main' | 'api' | 'event' | 'batch' | 'other';
  startPoint: string;
  endPoint: string;
  steps: ExecutionStep[];
  complexity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ExecutionStep {
  id: string;
  file: string;
  function: string;
  lineNumber?: number;
  type: 'function_call' | 'method_call' | 'condition' | 'loop' | 'return' | 'other';
  description: string;
  dependencies: string[];
}

export interface CodeEntryPoint {
  file: string;
  function: string;
  type: 'main' | 'api_endpoint' | 'event_handler' | 'cli_command' | 'other';
  parameters: string[];
  returnType: string;
  description: string;
  callsTo: string[];
}

export interface CallGraph {
  function: string;
  file: string;
  calls: CallRelation[];
  calledBy: CallRelation[];
  complexity: number;
}

export interface CallRelation {
  function: string;
  file: string;
  type: 'direct' | 'indirect' | 'conditional' | 'async';
  frequency: 'low' | 'medium' | 'high';
}

export interface ModuleInteraction {
  sourceModule: string;
  targetModule: string;
  interactionType: 'import' | 'api_call' | 'event' | 'data_flow' | 'other';
  strength: 'weak' | 'medium' | 'strong';
  description: string;
}

export interface DependencyInfo {
  internal: InternalDependency[];
  external: ExternalDependency[];
  circular: CircularDependency[];
  dependencyTree: DependencyNode[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface InternalDependency {
  source: string;
  target: string;
  type: 'import' | 'require' | 'include' | 'reference';
  strength: 'weak' | 'medium' | 'strong';
  isCircular: boolean;
}

export interface ExternalDependency {
  name: string;
  version: string;
  type: 'runtime' | 'development' | 'peer' | 'optional';
  usageCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  alternatives: string[];
}

export interface CircularDependency {
  id: string;
  cycle: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

export interface DependencyNode {
  name: string;
  type: 'file' | 'module' | 'package';
  children: DependencyNode[];
  depth: number;
  isCircular: boolean;
}

export interface DataFlowInfo {
  dataStreams: DataStream[];
  dataStores: DataStore[];
  transformations: DataTransformation[];
  flowPatterns: string[];
  bottlenecks: DataBottleneck[];
}

export interface DataStream {
  id: string;
  name: string;
  source: string;
  destination: string;
  dataType: string;
  volume: 'low' | 'medium' | 'high';
  frequency: 'realtime' | 'batch' | 'event' | 'scheduled';
  transformations: string[];
}

export interface DataStore {
  name: string;
  type: 'database' | 'cache' | 'file' | 'memory' | 'api' | 'other';
  accessPattern: 'read' | 'write' | 'read_write';
  dataTypes: string[];
  connectedComponents: string[];
}

export interface DataTransformation {
  id: string;
  name: string;
  input: string;
  output: string;
  transformationType: 'filter' | 'map' | 'reduce' | 'aggregate' | 'format' | 'validate';
  complexity: 'low' | 'medium' | 'high';
  location: string;
}

export interface DataBottleneck {
  id: string;
  location: string;
  type: 'processing' | 'io' | 'network' | 'memory' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

// Agent 4 output types - Risk Assessment
export interface RiskAssessment {
  repository: Repository;
  riskCategories: {
    high_risk: RiskItem[];
    medium_risk: RiskItem[];
    low_risk: RiskItem[];
  };
  vulnerabilities: SecurityVulnerability[];
  complexityMetrics: ComplexityMetrics;
  dependencyRisks: DependencyRisk[];
  migrationBlockers: MigrationBlocker[];
  overallRiskScore: number; // 0-100
  priorityActions: string[];
  timestamp: string;
}

export interface RiskItem {
  id: string;
  type: 'complexity' | 'dependency' | 'security' | 'architecture' | 'code_quality' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string; // File path or component
  impact: string;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  migrationImpact: 'blocker' | 'significant' | 'minor' | 'none';
}

export interface SecurityVulnerability {
  id: string;
  type: 'dependency' | 'code' | 'configuration' | 'api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  cveId?: string;
  fixVersion?: string;
  patchAvailable: boolean;
  recommendation: string;
  references: string[];
}

export interface ComplexityMetrics {
  fileComplexity: FileComplexityMetric[];
  overallComplexity: {
    totalLinesOfCode: number;
    averageFileSize: number;
    largestFiles: string[];
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
  };
  complexityHotspots: ComplexityHotspot[];
}

export interface FileComplexityMetric {
  file: string;
  linesOfCode: number;
  complexity: number;
  maintainabilityIndex: number;
  riskLevel: 'low' | 'medium' | 'high';
  issues: string[];
}

export interface ComplexityHotspot {
  location: string;
  type: 'large_file' | 'complex_function' | 'deep_nesting' | 'long_parameter_list' | 'god_class';
  severity: 'low' | 'medium' | 'high';
  metrics: Record<string, number>;
  description: string;
  refactoringSuggestion: string;
}

export interface DependencyRisk {
  name: string;
  currentVersion: string;
  type: 'runtime' | 'development' | 'peer' | 'optional';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: DependencyIssue[];
  recommendations: DependencyRecommendation[];
}

export interface DependencyIssue {
  type: 'outdated' | 'deprecated' | 'vulnerable' | 'unmaintained' | 'license_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: string;
  impact: string;
}

export interface DependencyRecommendation {
  action: 'update' | 'replace' | 'remove' | 'audit';
  targetVersion?: string;
  alternative?: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  migrationNotes?: string;
}

export interface MigrationBlocker {
  id: string;
  type: 'dependency' | 'architecture' | 'code' | 'infrastructure' | 'business_logic';
  severity: 'blocker' | 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  impact: string;
  location: string;
  blockedBy: string[];
  resolution: {
    effort: 'low' | 'medium' | 'high' | 'very_high';
    timeEstimate: string;
    steps: string[];
    alternatives: string[];
  };
  dependencies: string[]; // Other blockers this depends on
}

// Agent state types for LangGraph
export interface AgentState {
  repository?: Repository;
  repositoryAnalysis?: RepositoryAnalysis;
  architectureAnalysis?: ArchitectureAnalysis;
  codeFlowAnalysis?: CodeFlowAnalysis;
  riskAssessment?: RiskAssessment;
  currentStep: string;
  progress: number;
  errors: string[];
  metadata: Record<string, any>;
}

// API types
export interface AnalysisRequest {
  repositoryUrl: string;
  branch?: string;
  options?: {
    includeTests?: boolean;
    maxFiles?: number;
    includeContent?: boolean;
  };
}

export interface AnalysisResponse {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  result?: {
    repositoryAnalysis?: RepositoryAnalysis;
    architectureAnalysis?: ArchitectureAnalysis;
    codeFlowAnalysis?: CodeFlowAnalysis;
    riskAssessment?: RiskAssessment;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Error types
export interface AgentError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  agent: string;
  step: string;
}