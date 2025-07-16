import axios from 'axios';
import { Repository, FileInfo } from '../types';
import { logInfo, logError, logWarn } from './logger';

export class GitHubClient {
  private readonly baseURL = 'https://api.github.com';
  private readonly token?: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
  }

  private getHeaders() {
    return {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ai-legacy-migration-suite',
      ...(this.token && { 'Authorization': `token ${this.token}` })
    };
  }

  async getRepositoryInfo(owner: string, repo: string): Promise<Repository> {
    try {
      logInfo(`Fetching repository info for ${owner}/${repo}`);
      
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}`,
        { headers: this.getHeaders() }
      );

      const data = response.data;
      
      return {
        url: data.html_url,
        name: data.name,
        owner: data.owner.login,
        description: data.description,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        branch: data.default_branch,
        lastUpdated: data.updated_at
      };
    } catch (error) {
      logError(`Failed to fetch repository info for ${owner}/${repo}`, error as Error);
      throw new Error(`Failed to fetch repository info: ${(error as Error).message}`);
    }
  }

  async getRepositoryContents(owner: string, repo: string, path: string = '', branch?: string): Promise<FileInfo[]> {
    try {
      logInfo(`Fetching contents for ${owner}/${repo}${path ? `/${path}` : ''}`);
      
      const url = `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`;
      const params = branch ? { ref: branch } : {};
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params
      });

      const data = Array.isArray(response.data) ? response.data : [response.data];
      
      return data.map((item: any) => ({
        path: item.path,
        name: item.name,
        type: item.type === 'dir' ? 'directory' : 'file',
        size: item.size,
        extension: item.name.includes('.') ? item.name.split('.').pop() : undefined
      }));
    } catch (error) {
      logError(`Failed to fetch contents for ${owner}/${repo}/${path}`, error as Error);
      throw new Error(`Failed to fetch repository contents: ${(error as Error).message}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string, branch?: string): Promise<string> {
    try {
      logInfo(`Fetching file content for ${owner}/${repo}/${path}`);
      
      const url = `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`;
      const params = branch ? { ref: branch } : {};
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params
      });

      const data = response.data;
      
      if (data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      return data.content;
    } catch (error) {
      logError(`Failed to fetch file content for ${owner}/${repo}/${path}`, error as Error);
      throw new Error(`Failed to fetch file content: ${(error as Error).message}`);
    }
  }

  parseRepositoryUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }

  async getAllFiles(owner: string, repo: string, branch?: string, maxFiles: number = 1000): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const visited = new Set<string>();
    
    const processDirectory = async (path: string = '') => {
      if (files.length >= maxFiles) return;
      if (visited.has(path)) return;
      visited.add(path);
      
      try {
        const contents = await this.getRepositoryContents(owner, repo, path, branch);
        
        for (const item of contents) {
          if (files.length >= maxFiles) break;
          
          files.push(item);
          
          if (item.type === 'directory') {
            await processDirectory(item.path);
          }
        }
      } catch (error) {
        logWarn(`Failed to process directory ${path}: ${(error as Error).message}`);
      }
    };
    
    await processDirectory();
    return files;
  }
}