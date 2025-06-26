/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';
import { experimental_createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import {
  MCPClientConfig,
  MCPManagerStatus,
  MCPClientStatus,
  MCPTools,
  validateMCPClientConfig,
} from '@/types/mcp';

// 增加最大监听器数量，避免警告
EventEmitter.defaultMaxListeners = 20;


/**
 * 通用MCP客户端管理器
 * 
 * 功能特性：
 * - 🔄 单例模式 - 避免重复连接，优化资源使用
 * - 🧹 自动清理 - 进程退出时自动关闭所有连接
 * - 🔧 统一管理 - 集中管理多种MCP和API客户端
 * - ⚡ 按需连接 - 客户端懒加载，提升启动性能
 * - 🛡️ 错误恢复 - 完善的错误处理和重连机制
 */
class MCPClientManager {
  private static instance: MCPClientManager;
  private readonly mcpClients = new Map<string, any>();
  private readonly clientConfigs = new Map<string, MCPClientConfig>();

  private constructor() {
    // 私有构造函数，防止外部直接实例化
    this.initializeClientConfigs();
    
    // 添加进程退出时的资源清理
    process.on('beforeExit', async () => {
      await this.cleanupAllResources();
    });

    process.on('SIGINT', async () => {
      await this.cleanupAllResources();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.cleanupAllResources();
      process.exit(0);
    });
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MCPClientManager {
    if (!MCPClientManager.instance) {
      MCPClientManager.instance = new MCPClientManager();
    }
    return MCPClientManager.instance;
  }

  /**
   * 初始化客户端配置
   */
  private initializeClientConfigs(): void {
    // Puppeteer MCP 配置
    const puppeteerConfig = validateMCPClientConfig({
      name: 'puppeteer',
      command: 'npx',
      args: ['-y', 'puppeteer-mcp-server'],
      description: 'Puppeteer浏览器自动化服务',
      enabled: true,
    });
    this.clientConfigs.set('puppeteer', puppeteerConfig);

    // Google Maps MCP 配置
    const googleMapsConfig = validateMCPClientConfig({
      name: 'google-maps',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-maps'],
      env: { GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAP_API_KEY || '' },
      description: 'Google地图服务',
      enabled: true,
    });
    this.clientConfigs.set('google-maps', googleMapsConfig);

    // Exa MCP 配置
    const exaConfig = validateMCPClientConfig({
      name: 'exa',
      command: 'npx',
      args: [
        '-y',
        'exa-mcp-server',
        '--tools=web_search_exa,research_paper_search,company_research,crawling,competitor_finder,linkedin_search,wikipedia_search_exa,github_search',
      ],
      env: { EXA_API_KEY: process.env.EXA_API_KEY || '' },
      description: 'Exa搜索服务',
      enabled: true,
    });
    this.clientConfigs.set('exa', exaConfig);
  }

  /**
   * 获取MCP客户端
   * @param clientName 客户端名称
   * @returns MCP客户端实例
   */
  public async getMCPClient(clientName: string): Promise<any> {
    // 如果客户端已存在，直接返回
    if (this.mcpClients.has(clientName)) {
      return this.mcpClients.get(clientName);
    }

    // 获取客户端配置
    const config = this.clientConfigs.get(clientName);
    if (!config) {
      throw new Error(`未知的MCP客户端: ${clientName}`);
    }

    console.log(`🚀 正在初始化 ${config.description} (${clientName})...`);

    try {
      // 验证必需的环境变量
      if (config.env) {
        for (const [key, value] of Object.entries(config.env)) {
          if (!value) {
            throw new Error(`缺少必需的环境变量: ${key}`);
          }
        }
      }

      // 创建传输层
      const transport = new Experimental_StdioMCPTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });

      // 创建MCP客户端
      const client = await experimental_createMCPClient({
        transport,
      });

      // 缓存客户端
      this.mcpClients.set(clientName, client);
      console.log(`✅ ${config.description} 初始化成功`);

      return client;
    } catch (error) {
      console.error(`❌ ${config.description} 初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 获取MCP客户端工具
   * @param clientName 客户端名称
   * @param schemas 可选的schema配置
   * @returns 工具对象
   */
  public async getMCPTools(
    clientName: string,
    schemas?: Record<string, any>
  ): Promise<MCPTools> {
    const client = await this.getMCPClient(clientName);
    
    try {
      const tools = schemas ? await client.tools({ schemas }) : await client.tools();
      const config = this.clientConfigs.get(clientName);
      console.log(`🔧 已获取 ${config?.description} 工具: ${Object.keys(tools).join(', ')}`);
      return tools;
    } catch (error) {
      console.error(`❌ 获取 ${clientName} 工具失败:`, error);
      return {};
    }
  }

  /**
   * Puppeteer MCP 客户端
   */
  public async getPuppeteerMCPClient(): Promise<any> {
    return this.getMCPClient('puppeteer');
  }

  /**
   * Puppeteer MCP 工具
   */
  public async getPuppeteerMCPTools(): Promise<MCPTools> {
    return this.getMCPTools('puppeteer');
  }

  /**
   * Google Maps MCP 客户端
   */
  public async getGoogleMapsMCPClient(): Promise<any> {
    return this.getMCPClient('google-maps');
  }

  /**
   * Google Maps MCP 工具
   */
  public async getGoogleMapsMCPTools(schemas?: Record<string, any>): Promise<MCPTools> {
    return this.getMCPTools('google-maps', schemas);
  }

  /**
   * Exa MCP 客户端
   */
  public async getExaMCPClient(): Promise<any> {
    return this.getMCPClient('exa');
  }

  /**
   * Exa MCP 工具
   */
  public async getExaMCPTools(): Promise<MCPTools> {
    return this.getMCPTools('exa');
  }

  /**
   * 关闭指定的MCP客户端
   * @param clientName 客户端名称
   */
  public async closeMCPClient(clientName: string): Promise<void> {
    if (this.mcpClients.has(clientName)) {
      const client = this.mcpClients.get(clientName);
      const config = this.clientConfigs.get(clientName);
      
      try {
        if (client.close) {
          await client.close();
        }
        this.mcpClients.delete(clientName);
        console.log(`🔒 ${config?.description} 客户端已关闭`);
      } catch (error) {
        console.error(`❌ 关闭 ${config?.description} 客户端出错:`, error);
      }
    }
  }

  /**
   * 检查客户端是否已连接
   * @param clientName 客户端名称
   * @returns 是否已连接
   */
  public isClientConnected(clientName: string): boolean {
    return this.mcpClients.has(clientName);
  }

  /**
   * 获取所有已连接的客户端列表
   * @returns 客户端名称列表
   */
  public getConnectedClients(): string[] {
    return Array.from(this.mcpClients.keys());
  }

  /**
   * 获取所有可用的客户端配置
   * @returns 配置映射
   */
  public getAvailableClients(): ReadonlyMap<string, MCPClientConfig> {
    return this.clientConfigs;
  }

  /**
   * 清理所有资源
   */
  private async cleanupAllResources(): Promise<void> {
    console.log('🧹 开始清理MCP客户端资源...');
    
    const closePromises = Array.from(this.mcpClients.keys()).map(clientName =>
      this.closeMCPClient(clientName)
    );

    await Promise.allSettled(closePromises);
    console.log('✅ MCP客户端资源清理完成');
  }

  /**
   * 重连指定客户端
   * @param clientName 客户端名称
   */
  public async reconnectClient(clientName: string): Promise<any> {
    console.log(`🔄 重连 ${clientName} 客户端...`);
    await this.closeMCPClient(clientName);
    return this.getMCPClient(clientName);
  }

  /**
   * 获取客户端状态信息
   * @returns 状态信息对象
   */
  public getStatus(): MCPManagerStatus {
    const connectedClients = this.getConnectedClients();
    const availableClients = Array.from(this.clientConfigs.keys());

    // 构建客户端状态列表
    const clients: MCPClientStatus[] = availableClients.map(name => ({
      name,
      connected: connectedClients.includes(name),
      lastConnected: null, // TODO: 添加实际的连接时间追踪
      error: null, // TODO: 添加实际的错误状态追踪
    }));

    return {
      availableClients,
      connectedClients,
      clients,
    };
  }
}

// 导出单例实例和快捷访问函数
const mcpClientManager = MCPClientManager.getInstance();

export default mcpClientManager;

// 快捷访问函数
export const getPuppeteerMCPClient = () => mcpClientManager.getPuppeteerMCPClient();
export const getPuppeteerMCPTools = () => mcpClientManager.getPuppeteerMCPTools();

export const getGoogleMapsMCPClient = () => mcpClientManager.getGoogleMapsMCPClient();
export const getGoogleMapsMCPTools = (schemas?: Record<string, any>) =>
  mcpClientManager.getGoogleMapsMCPTools(schemas);

export const getExaMCPClient = () => mcpClientManager.getExaMCPClient();
export const getExaMCPTools = () => mcpClientManager.getExaMCPTools();

// 客户端管理函数
export const closeMCPClient = (clientName: string) => mcpClientManager.closeMCPClient(clientName);
export const reconnectMCPClient = (clientName: string) => mcpClientManager.reconnectClient(clientName);
export const getMCPStatus = () => mcpClientManager.getStatus();