import { 
  RepositoryAnalysis, 
  ArchitectureAnalysis,
  CodeFlowAnalysis,
  RiskAssessment,
  RiskItem,
  SecurityVulnerability,
  ComplexityMetrics,
  DependencyRisk,
  MigrationBlocker,
  FileComplexityMetric,
  ComplexityHotspot,
  DependencyIssue,
  DependencyRecommendation,
  FileInfo,
  TechStack
} from '../../shared/types';
import { 
  LLMClient, 
  logInfo, 
  logError 
} from '../../shared/utils';
import { 
  logAnalysisStart,
  logStep,
  logProgress,
  logSuccess,
  logAnalysisError
} from '../../shared/utils/simple-enhanced-logger';
import { logAgent4Input, logAgent4Output, logAgent4Error } from '../../shared/utils/agent-io-logger';

export interface RiskAssessmentState {
  repositoryAnalysis: RepositoryAnalysis;
  architectureAnalysis: ArchitectureAnalysis;
  codeFlowAnalysis?: CodeFlowAnalysis;
  riskAssessment?: RiskAssessment;
  currentStep: string;
  progress: number;
  errors: string[];
  metadata: Record<string, any>;
}

export class RiskAssessmentAgent {
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient({ provider: 'gemini' });
  }

  private calculateFileComplexity(files: FileInfo[]): FileComplexityMetric[] {
    return files
      .filter(f => f.content && f.type === 'file')
      .map(file => {
        const content = file.content!;
        const linesOfCode = content.split('\n').length;
        
        // Simple complexity heuristics
        const complexity = this.calculateSimpleComplexity(content);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(linesOfCode, complexity);
        const riskLevel = this.determineFileRiskLevel(linesOfCode, complexity);
        const issues = this.identifyFileIssues(file, content);

        return {
          file: file.path,
          linesOfCode,
          complexity,
          maintainabilityIndex,
          riskLevel,
          issues
        };
      })
      .sort((a, b) => b.complexity - a.complexity);
  }

  private calculateSimpleComplexity(content: string): number {
    // Simple cyclomatic complexity approximation
    const conditionals = (content.match(/\b(if|else|while|for|switch|case|catch|&&|\|\|)\b/g) || []).length;
    const functions = (content.match(/\b(function|def|class|method|public|private)\b/g) || []).length;
    const complexity = conditionals + functions + 1; // Base complexity of 1
    return Math.min(complexity, 100); // Cap at 100
  }

  private calculateMaintainabilityIndex(loc: number, complexity: number): number {
    // Simplified maintainability index (0-100, higher is better)
    const baseIndex = 100;
    const locPenalty = Math.log(loc) * 2;
    const complexityPenalty = complexity * 3;
    return Math.max(0, baseIndex - locPenalty - complexityPenalty);
  }

  private determineFileRiskLevel(loc: number, complexity: number): 'low' | 'medium' | 'high' {
    if (loc > 1000 || complexity > 20) return 'high';
    if (loc > 500 || complexity > 10) return 'medium';
    return 'low';
  }

  private identifyFileIssues(file: FileInfo, content: string): string[] {
    const issues: string[] = [];
    
    if (file.size && file.size > 10000) {
      issues.push('Large file size');
    }
    
    if (content.split('\n').length > 500) {
      issues.push('High line count');
    }
    
    // Check for potential code smells
    if ((content.match(/\btodo\b/gi) || []).length > 5) {
      issues.push('Many TODO comments');
    }
    
    if ((content.match(/\bfixme\b/gi) || []).length > 0) {
      issues.push('Contains FIXME comments');
    }
    
    if ((content.match(/console\.log|System\.out\.print|print\(/g) || []).length > 5) {
      issues.push('Many debug statements');
    }

    return issues;
  }

  private analyzeDependencyRisks(repositoryAnalysis: RepositoryAnalysis): DependencyRisk[] {
    const dependencyRisks: DependencyRisk[] = [];
    const dependencyFiles = repositoryAnalysis.fileStructure.categories.dependency || [];

    for (const file of dependencyFiles) {
      if (!file.content) continue;

      const risks = this.parseDependencyFile(file);
      dependencyRisks.push(...risks);
    }

    return dependencyRisks;
  }

  private parseDependencyFile(file: FileInfo): DependencyRisk[] {
    const risks: DependencyRisk[] = [];
    
    try {
      if (file.name === 'package.json') {
        const packageJson = JSON.parse(file.content!);
        risks.push(...this.analyzeNpmDependencies(packageJson));
      } else if (file.name === 'pom.xml') {
        risks.push(...this.analyzeMavenDependencies(file.content!));
      } else if (file.name === 'requirements.txt') {
        risks.push(...this.analyzePythonDependencies(file.content!));
      }
    } catch (error) {
      logError(`Failed to parse dependency file ${file.name}`, error as Error);
    }

    return risks;
  }

  private analyzeNpmDependencies(packageJson: any): DependencyRisk[] {
    const risks: DependencyRisk[] = [];
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const [name, version] of Object.entries(dependencies)) {
      const risk = this.assessNpmDependency(name, version as string);
      if (risk) risks.push(risk);
    }

    return risks;
  }

  private assessNpmDependency(name: string, version: string): DependencyRisk | null {
    const issues: DependencyIssue[] = [];
    const recommendations: DependencyRecommendation[] = [];
    
    // Check for known problematic packages
    const vulnerablePackages = ['lodash', 'moment', 'request', 'bower'];
    const deprecatedPackages = ['gulp', 'grunt'];
    
    if (vulnerablePackages.includes(name)) {
      issues.push({
        type: 'vulnerable',
        severity: 'medium',
        description: `${name} has known security vulnerabilities`,
        details: `Package ${name} has reported security issues in older versions`,
        impact: 'Potential security vulnerabilities in application'
      });
      
      recommendations.push({
        action: 'update',
        effort: 'medium',
        priority: 'high',
        description: `Update ${name} to latest secure version`
      });
    }
    
    if (deprecatedPackages.includes(name)) {
      issues.push({
        type: 'deprecated',
        severity: 'low',
        description: `${name} is deprecated`,
        details: `Package ${name} is no longer actively maintained`,
        impact: 'May not receive security updates or bug fixes'
      });
    }

    if (issues.length === 0) return null;

    return {
      name,
      currentVersion: version,
      type: 'runtime',
      riskLevel: issues.some(i => i.severity === 'high') ? 'high' : 'medium',
      issues,
      recommendations
    };
  }

  private analyzeMavenDependencies(pomContent: string): DependencyRisk[] {
    // Simplified Maven dependency analysis
    const risks: DependencyRisk[] = [];
    const log4jMatch = pomContent.match(/<artifactId>log4j.*<\/artifactId>/);
    
    if (log4jMatch) {
      risks.push({
        name: 'log4j',
        currentVersion: 'unknown',
        type: 'runtime',
        riskLevel: 'critical',
        issues: [{
          type: 'vulnerable',
          severity: 'critical',
          description: 'Log4j has critical security vulnerabilities',
          details: 'Log4j versions before 2.17.0 have critical RCE vulnerabilities',
          impact: 'Remote code execution vulnerability'
        }],
        recommendations: [{
          action: 'update',
          targetVersion: '2.17.0+',
          effort: 'high',
          priority: 'critical',
          description: 'Immediately update Log4j to version 2.17.0 or higher'
        }]
      });
    }

    return risks;
  }

  private analyzePythonDependencies(requirementsContent: string): DependencyRisk[] {
    const risks: DependencyRisk[] = [];
    const lines = requirementsContent.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const [name] = line.split(/[==>=<]/);
      if (name && name.trim()) {
        const risk = this.assessPythonDependency(name.trim(), line);
        if (risk) risks.push(risk);
      }
    }

    return risks;
  }

  private assessPythonDependency(name: string, line: string): DependencyRisk | null {
    const vulnerablePackages = ['pillow', 'requests', 'urllib3'];
    
    if (vulnerablePackages.includes(name.toLowerCase())) {
      return {
        name,
        currentVersion: line,
        type: 'runtime',
        riskLevel: 'medium',
        issues: [{
          type: 'vulnerable',
          severity: 'medium',
          description: `${name} may have security vulnerabilities`,
          details: `Package ${name} has had security issues in the past`,
          impact: 'Potential security vulnerabilities'
        }],
        recommendations: [{
          action: 'update',
          effort: 'low',
          priority: 'medium',
          description: `Update ${name} to latest version`
        }]
      };
    }

    return null;
  }

  private identifyMigrationBlockers(
    repositoryAnalysis: RepositoryAnalysis,
    architectureAnalysis: ArchitectureAnalysis,
    dependencyRisks: DependencyRisk[]
  ): MigrationBlocker[] {
    const blockers: MigrationBlocker[] = [];

    // Critical dependency blockers
    const criticalDeps = dependencyRisks.filter(d => d.riskLevel === 'critical');
    for (const dep of criticalDeps) {
      blockers.push({
        id: `dep-${dep.name}`,
        type: 'dependency',
        severity: 'blocker',
        title: `Critical dependency: ${dep.name}`,
        description: dep.issues[0]?.description || 'Critical dependency issue',
        impact: 'Migration cannot proceed without resolving this dependency',
        location: `Dependencies: ${dep.name}`,
        blockedBy: [],
        resolution: {
          effort: 'high',
          timeEstimate: '1-2 weeks',
          steps: dep.recommendations.map(r => r.description),
          alternatives: []
        },
        dependencies: []
      });
    }

    // Architecture blockers
    const complexityBlockers = architectureAnalysis.architectureDetails.riskFactors;
    for (const risk of complexityBlockers.slice(0, 3)) { // Top 3 risks
      blockers.push({
        id: `arch-${risk.replace(/\s+/g, '-').toLowerCase()}`,
        type: 'architecture',
        severity: 'major',
        title: `Architecture Risk: ${risk}`,
        description: `Architecture pattern presents migration challenges: ${risk}`,
        impact: 'May require significant refactoring during migration',
        location: 'Architecture',
        blockedBy: [],
        resolution: {
          effort: 'very_high',
          timeEstimate: '2-4 weeks',
          steps: ['Analyze impact', 'Plan refactoring', 'Implement changes', 'Test thoroughly'],
          alternatives: ['Gradual migration', 'Strangler fig pattern']
        },
        dependencies: []
      });
    }

    return blockers;
  }

  private calculateOverallRiskScore(
    complexityMetrics: ComplexityMetrics,
    dependencyRisks: DependencyRisk[],
    migrationBlockers: MigrationBlocker[]
  ): number {
    let score = 0;
    
    // Complexity score (0-40 points)
    const avgComplexity = complexityMetrics.overallComplexity.cyclomaticComplexity;
    score += Math.min(avgComplexity, 40);
    
    // Dependency risk score (0-30 points)
    const criticalDeps = dependencyRisks.filter(d => d.riskLevel === 'critical').length;
    const highDeps = dependencyRisks.filter(d => d.riskLevel === 'high').length;
    score += criticalDeps * 10 + highDeps * 5;
    
    // Migration blocker score (0-30 points)
    const blockers = migrationBlockers.filter(b => b.severity === 'blocker').length;
    const critical = migrationBlockers.filter(b => b.severity === 'critical').length;
    score += blockers * 15 + critical * 10;
    
    return Math.min(score, 100);
  }

  private generatePriorityActions(
    dependencyRisks: DependencyRisk[],
    migrationBlockers: MigrationBlocker[],
    complexityHotspots: ComplexityHotspot[]
  ): string[] {
    const actions: string[] = [];
    
    // Critical dependencies first
    const criticalDeps = dependencyRisks.filter(d => d.riskLevel === 'critical');
    for (const dep of criticalDeps.slice(0, 3)) {
      actions.push(`URGENT: Update ${dep.name} - ${dep.issues[0]?.description}`);
    }
    
    // Migration blockers
    const criticalBlockers = migrationBlockers.filter(b => b.severity === 'blocker');
    for (const blocker of criticalBlockers.slice(0, 2)) {
      actions.push(`BLOCKER: ${blocker.title}`);
    }
    
    // Complexity hotspots
    const highComplexity = complexityHotspots.filter(h => h.severity === 'high');
    for (const hotspot of highComplexity.slice(0, 2)) {
      actions.push(`REFACTOR: ${hotspot.description}`);
    }
    
    return actions.slice(0, 5); // Top 5 priorities
  }

  private async createRiskAnalysisPrompt(
    repositoryAnalysis: RepositoryAnalysis,
    architectureAnalysis: ArchitectureAnalysis,
    complexityMetrics: ComplexityMetrics,
    dependencyRisks: DependencyRisk[]
  ): Promise<string> {
    const topComplexFiles = complexityMetrics.fileComplexity.slice(0, 5);
    const criticalDeps = dependencyRisks.filter(d => d.riskLevel === 'critical' || d.riskLevel === 'high');
    
    return `
Analyze the migration risks for this repository based on the comprehensive data provided:

## Repository Overview
Repository: ${repositoryAnalysis.repository.name}
Project Type: ${repositoryAnalysis.summary.projectType}
Architecture: ${architectureAnalysis.architecture.type} (${architectureAnalysis.architecture.complexity} complexity)
Primary Technology: ${architectureAnalysis.architecture.techStack.language}
Frameworks: ${architectureAnalysis.architecture.techStack.frameworks.join(', ')}

## Complexity Analysis
Total Files: ${repositoryAnalysis.fileStructure.totalFiles}
Source Files: ${repositoryAnalysis.fileStructure.categories.source?.length || 0}
Average File Size: ${complexityMetrics.overallComplexity.averageFileSize} lines
Overall Complexity: ${complexityMetrics.overallComplexity.cyclomaticComplexity}

Top Complex Files:
${topComplexFiles.map(f => `- ${f.file}: ${f.linesOfCode} LOC, complexity ${f.complexity} (${f.riskLevel} risk)`).join('\n')}

## Dependency Risks
Critical/High Risk Dependencies: ${criticalDeps.length}
${criticalDeps.map(d => `- ${d.name}: ${d.issues[0]?.description || 'High risk dependency'}`).join('\n')}

## Architecture Risks
Identified Weaknesses:
${architectureAnalysis.architectureDetails.weaknesses.map(w => `- ${w}`).join('\n')}

Risk Factors:
${architectureAnalysis.architectureDetails.riskFactors.map(r => `- ${r}`).join('\n')}

## Request
Based on this analysis, identify:

1. **Additional Risk Items**: Beyond what's already identified, what other risks do you see?
2. **Security Concerns**: What security vulnerabilities or concerns exist?
3. **Code Quality Issues**: What patterns indicate poor code quality?
4. **Performance Bottlenecks**: What could cause performance issues during migration?
5. **Architecture Anti-patterns**: What architectural decisions will complicate migration?

Provide specific, actionable insights that will help prioritize migration efforts and avoid common pitfalls.
    `;
  }

  async analyze(
    repositoryAnalysis: RepositoryAnalysis,
    architectureAnalysis: ArchitectureAnalysis,
    codeFlowAnalysis?: CodeFlowAnalysis
  ): Promise<RiskAssessment> {
    const inputId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Log detailed input
    await logAgent4Input(inputId, {
      repositoryAnalysis,
      architectureAnalysis,
      codeFlowAnalysis
    });

    logAnalysisStart('Risk Assessment Analysis', { 
      repository: repositoryAnalysis.repository.name 
    });

    const startTime = Date.now();

    try {
      let state: RiskAssessmentState = {
        repositoryAnalysis,
        architectureAnalysis,
        codeFlowAnalysis,
        currentStep: 'init',
        progress: 0,
        errors: [],
        metadata: {}
      };

      // Step 1: Calculate complexity metrics
      logStep('Complexity Analysis', { operation: 'Analyzing code complexity' });
      const fileComplexityMetrics = this.calculateFileComplexity(repositoryAnalysis.fileStructure.files);
      
      const complexityMetrics: ComplexityMetrics = {
        fileComplexity: fileComplexityMetrics,
        overallComplexity: {
          totalLinesOfCode: fileComplexityMetrics.reduce((sum, f) => sum + f.linesOfCode, 0),
          averageFileSize: fileComplexityMetrics.length > 0 
            ? fileComplexityMetrics.reduce((sum, f) => sum + f.linesOfCode, 0) / fileComplexityMetrics.length 
            : 0,
          largestFiles: fileComplexityMetrics.slice(0, 5).map(f => f.file),
          cyclomaticComplexity: fileComplexityMetrics.length > 0
            ? fileComplexityMetrics.reduce((sum, f) => sum + f.complexity, 0) / fileComplexityMetrics.length
            : 0,
          maintainabilityIndex: fileComplexityMetrics.length > 0
            ? fileComplexityMetrics.reduce((sum, f) => sum + f.maintainabilityIndex, 0) / fileComplexityMetrics.length
            : 100
        },
        complexityHotspots: fileComplexityMetrics
          .filter(f => f.riskLevel === 'high')
          .slice(0, 10)
          .map(f => ({
            location: f.file,
            type: 'large_file' as const,
            severity: 'high' as const,
            metrics: { linesOfCode: f.linesOfCode, complexity: f.complexity },
            description: `High complexity file with ${f.linesOfCode} lines and complexity ${f.complexity}`,
            refactoringSuggestion: 'Consider breaking this file into smaller, more focused modules'
          }))
      };

      logProgress(`Analyzed complexity for ${fileComplexityMetrics.length} files`);
      state.progress = 25;

      // Step 2: Analyze dependency risks
      logStep('Dependency Analysis', { operation: 'Scanning dependency vulnerabilities' });
      const dependencyRisks = this.analyzeDependencyRisks(repositoryAnalysis);
      logProgress(`Found ${dependencyRisks.length} dependency risks`);
      state.progress = 50;

      // Step 3: Identify migration blockers
      logStep('Migration Blocker Analysis', { operation: 'Identifying migration blockers' });
      const migrationBlockers = this.identifyMigrationBlockers(
        repositoryAnalysis, 
        architectureAnalysis, 
        dependencyRisks
      );
      logProgress(`Identified ${migrationBlockers.length} migration blockers`);
      state.progress = 75;

      // Step 4: AI-enhanced risk analysis
      logStep('AI Risk Analysis', { model: 'Gemini AI' });
      const riskAnalysisPrompt = await this.createRiskAnalysisPrompt(
        repositoryAnalysis,
        architectureAnalysis, 
        complexityMetrics,
        dependencyRisks
      );

      const aiRiskAnalysis = await this.llmClient.generateStructuredResponse<{
        additionalRisks: Array<{
          type: string;
          severity: string;
          title: string;
          description: string;
          location: string;
          recommendation: string;
        }>;
        securityConcerns: Array<{
          type: string;
          severity: string;
          description: string;
          location: string;
          mitigation: string;
        }>;
        qualityIssues: string[];
        performanceBottlenecks: string[];
        architectureAntiPatterns: string[];
      }>(
        riskAnalysisPrompt,
        JSON.stringify({
          additionalRisks: [{ type: 'string', severity: 'string', title: 'string', description: 'string', location: 'string', recommendation: 'string' }],
          securityConcerns: [{ type: 'string', severity: 'string', description: 'string', location: 'string', mitigation: 'string' }],
          qualityIssues: ['string'],
          performanceBottlenecks: ['string'],
          architectureAntiPatterns: ['string']
        }),
        'You are an expert software architect and security specialist analyzing migration risks.'
      );

      // Step 5: Compile final assessment
      const overallRiskScore = this.calculateOverallRiskScore(complexityMetrics, dependencyRisks, migrationBlockers);
      
      // Categorize all risks
      const allRiskItems: RiskItem[] = [
        // Complexity risks
        ...complexityMetrics.complexityHotspots.map(h => ({
          id: `complexity-${h.location.replace(/\//g, '-')}`,
          type: 'complexity' as const,
          severity: h.severity,
          title: `Complex file: ${h.location}`,
          description: h.description,
          location: h.location,
          impact: 'High complexity makes modification and testing difficult',
          recommendation: h.refactoringSuggestion,
          effort: 'high' as const,
          migrationImpact: 'significant' as const
        })),
        // AI-identified additional risks
        ...aiRiskAnalysis.additionalRisks.map(r => ({
          id: `ai-risk-${r.title.replace(/\s+/g, '-').toLowerCase()}`,
          type: r.type as any,
          severity: r.severity as any,
          title: r.title,
          description: r.description,
          location: r.location,
          impact: `AI-identified risk: ${r.description}`,
          recommendation: r.recommendation,
          effort: 'medium' as const,
          migrationImpact: 'minor' as const
        }))
      ];

      // Convert security concerns to vulnerabilities
      const vulnerabilities: SecurityVulnerability[] = [
        ...dependencyRisks
          .filter(d => d.issues.some(i => i.type === 'vulnerable'))
          .map(d => ({
            id: `vuln-${d.name}`,
            type: 'dependency' as const,
            severity: d.issues[0].severity,
            title: `Vulnerable dependency: ${d.name}`,
            description: d.issues[0].description,
            location: `Dependencies: ${d.name} ${d.currentVersion}`,
            fixVersion: d.recommendations[0]?.targetVersion,
            patchAvailable: d.recommendations.some(r => r.action === 'update'),
            recommendation: d.recommendations[0]?.description || 'Update to secure version',
            references: []
          })),
        ...aiRiskAnalysis.securityConcerns.map(s => ({
          id: `security-${s.type}-${Date.now()}`,
          type: s.type as any,
          severity: s.severity as any,
          title: `Security concern: ${s.type}`,
          description: s.description,
          location: s.location,
          patchAvailable: false,
          recommendation: s.mitigation,
          references: []
        }))
      ];

      // Categorize risks by severity
      const riskCategories = {
        high_risk: allRiskItems.filter(r => r.severity === 'high' || r.severity === 'critical'),
        medium_risk: allRiskItems.filter(r => r.severity === 'medium'),
        low_risk: allRiskItems.filter(r => r.severity === 'low')
      };

      const priorityActions = this.generatePriorityActions(dependencyRisks, migrationBlockers, complexityMetrics.complexityHotspots);

      const riskAssessment: RiskAssessment = {
        repository: repositoryAnalysis.repository,
        riskCategories,
        vulnerabilities,
        complexityMetrics,
        dependencyRisks,
        migrationBlockers,
        overallRiskScore,
        priorityActions,
        timestamp: new Date().toISOString()
      };

      const executionTime = (Date.now() - startTime) / 1000;

      // Log detailed output
      await logAgent4Output(inputId, riskAssessment, executionTime);

      logSuccess('Risk Assessment Analysis Completed', {
        repository: repositoryAnalysis.repository.name,
        overallRiskScore,
        totalRisks: allRiskItems.length,
        vulnerabilities: vulnerabilities.length,
        migrationBlockers: migrationBlockers.length
      });

      return riskAssessment;

    } catch (error) {
      const executionTime = (Date.now() - startTime) / 1000;
      await logAgent4Error(inputId, error as Error, executionTime);
      logAnalysisError('Risk assessment analysis failed', error as Error);
      throw error;
    }
  }
}

export default RiskAssessmentAgent;