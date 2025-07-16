import { FileInfo, FileCategory } from '../types';

// File extension mappings
const FILE_CATEGORY_MAPPINGS: Record<string, FileCategory> = {
  // Source files
  'js': 'source',
  'ts': 'source',
  'jsx': 'source',
  'tsx': 'source',
  'py': 'source',
  'java': 'source',
  'cpp': 'source',
  'c': 'source',
  'cs': 'source',
  'go': 'source',
  'rs': 'source',
  'php': 'source',
  'rb': 'source',
  'swift': 'source',
  'kt': 'source',
  'scala': 'source',
  'dart': 'source',
  'vue': 'source',
  
  // Configuration files
  'json': 'config',
  'yaml': 'config',
  'yml': 'config',
  'xml': 'config',
  'toml': 'config',
  'ini': 'config',
  'conf': 'config',
  'config': 'config',
  'env': 'config',
  'properties': 'config',
  
  // Documentation
  'md': 'documentation',
  'txt': 'documentation',
  'rst': 'documentation',
  'adoc': 'documentation',
  
  // Test files
  'test': 'test',
  'spec': 'test',
  
  // Build files
  'dockerfile': 'build',
  'makefile': 'build',
  'gradle': 'build',
  'cmake': 'build',
  
  // Assets
  'png': 'asset',
  'jpg': 'asset',
  'jpeg': 'asset',
  'gif': 'asset',
  'svg': 'asset',
  'ico': 'asset',
  'css': 'asset',
  'scss': 'asset',
  'sass': 'asset',
  'less': 'asset',
  'html': 'asset',
  'htm': 'asset',
};

// Special file names
const SPECIAL_FILES: Record<string, FileCategory> = {
  'package.json': 'dependency',
  'package-lock.json': 'dependency',
  'yarn.lock': 'dependency',
  'pom.xml': 'dependency',
  'requirements.txt': 'dependency',
  'Gemfile': 'dependency',
  'Gemfile.lock': 'dependency',
  'composer.json': 'dependency',
  'composer.lock': 'dependency',
  'go.mod': 'dependency',
  'go.sum': 'dependency',
  'Cargo.toml': 'dependency',
  'Cargo.lock': 'dependency',
  'pubspec.yaml': 'dependency',
  'pubspec.lock': 'dependency',
  
  'README.md': 'documentation',
  'README.txt': 'documentation',
  'README': 'documentation',
  'CHANGELOG.md': 'documentation',
  'CHANGELOG': 'documentation',
  'LICENSE': 'documentation',
  'LICENSE.md': 'documentation',
  'CONTRIBUTING.md': 'documentation',
  
  'Dockerfile': 'build',
  'docker-compose.yml': 'build',
  'docker-compose.yaml': 'build',
  'Makefile': 'build',
  'makefile': 'build',
  'build.gradle': 'build',
  'build.xml': 'build',
  'CMakeLists.txt': 'build',
  
  '.gitignore': 'config',
  '.eslintrc.js': 'config',
  '.eslintrc.json': 'config',
  '.prettierrc': 'config',
  'tsconfig.json': 'config',
  'webpack.config.js': 'config',
  'vite.config.js': 'config',
  'jest.config.js': 'config',
};

export function categorizeFile(file: FileInfo): FileCategory {
  const fileName = file.name.toLowerCase();
  
  // Check special files first
  if (SPECIAL_FILES[fileName]) {
    return SPECIAL_FILES[fileName];
  }
  
  // Check if it's a test file
  if (fileName.includes('.test.') || fileName.includes('.spec.') || 
      fileName.includes('test') || fileName.includes('spec')) {
    return 'test';
  }
  
  // Check by extension
  if (file.extension) {
    const ext = file.extension.toLowerCase();
    if (FILE_CATEGORY_MAPPINGS[ext]) {
      return FILE_CATEGORY_MAPPINGS[ext];
    }
  }
  
  return 'other';
}

export function categorizeFiles(files: FileInfo[]): Record<FileCategory, FileInfo[]> {
  const categories: Record<FileCategory, FileInfo[]> = {
    source: [],
    config: [],
    documentation: [],
    test: [],
    build: [],
    dependency: [],
    asset: [],
    other: []
  };
  
  files.forEach(file => {
    if (file.type === 'file') {
      const category = categorizeFile(file);
      file.category = category;
      categories[category].push(file);
    }
  });
  
  return categories;
}

export function identifyMainFiles(files: FileInfo[]): FileInfo[] {
  const mainFiles: FileInfo[] = [];
  
  const mainFilePatterns = [
    /^main\./,
    /^index\./,
    /^app\./,
    /^server\./,
    /^start\./,
    /^run\./,
    /^entry\./,
    /^bootstrap\./,
    /^init\./,
    /^setup\./,
    /^config\./,
    /^application\./,
    /^program\./,
    /^cli\./,
    /^bin\//,
    /^src\/main/,
    /^src\/index/,
    /^src\/app/,
    /package\.json$/,
    /pom\.xml$/,
    /build\.gradle$/,
    /Dockerfile$/,
    /docker-compose\.ya?ml$/,
    /Makefile$/,
    /README\.md$/,
    /README$/,
  ];
  
  files.forEach(file => {
    if (file.type === 'file') {
      const isMainFile = mainFilePatterns.some(pattern => 
        pattern.test(file.path.toLowerCase()) || pattern.test(file.name.toLowerCase())
      );
      
      if (isMainFile) {
        mainFiles.push(file);
      }
    }
  });
  
  return mainFiles;
}

export function getFileExtension(filename: string): string | undefined {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return undefined;
  }
  return filename.substring(lastDotIndex + 1);
}

export function isTextFile(filename: string): boolean {
  const textExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb',
    'swift', 'kt', 'scala', 'dart', 'vue', 'json', 'yaml', 'yml', 'xml', 'toml', 'ini',
    'conf', 'config', 'env', 'properties', 'md', 'txt', 'rst', 'adoc', 'css', 'scss',
    'sass', 'less', 'html', 'htm', 'dockerfile', 'makefile', 'gradle', 'cmake', 'sql',
    'sh', 'bat', 'ps1', 'r', 'lua', 'perl', 'groovy', 'clj', 'ex', 'elm', 'hs'
  ];
  
  const extension = getFileExtension(filename.toLowerCase());
  return extension ? textExtensions.includes(extension) : false;
}

export function shouldProcessFile(file: FileInfo, options: { maxFileSize?: number } = {}): boolean {
  const { maxFileSize = 1024 * 1024 } = options; // 1MB default
  
  // Skip directories
  if (file.type === 'directory') {
    return false;
  }
  
  // Skip large files
  if (file.size && file.size > maxFileSize) {
    return false;
  }
  
  // Skip binary files
  if (!isTextFile(file.name)) {
    return false;
  }
  
  // Skip common uninteresting files
  const skipPatterns = [
    /node_modules/,
    /\.git/,
    /\.vscode/,
    /\.idea/,
    /\.vs/,
    /bin/,
    /obj/,
    /target/,
    /build/,
    /dist/,
    /out/,
    /\.min\./,
    /\.bundle\./,
    /\.map$/,
    /\.lock$/,
    /\.log$/,
    /\.tmp$/,
    /\.cache$/
  ];
  
  return !skipPatterns.some(pattern => pattern.test(file.path));
}