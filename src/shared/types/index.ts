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
  timestamp: string;
}

// Agent state types for LangGraph
export interface AgentState {
  repository?: Repository;
  repositoryAnalysis?: RepositoryAnalysis;
  architectureAnalysis?: ArchitectureAnalysis;
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