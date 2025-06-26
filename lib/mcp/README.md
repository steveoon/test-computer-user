# MCP客户端管理器

这个模块提供了一个统一的MCP (Model Context Protocol) 客户端管理系统，用于集中管理多种MCP服务和API客户端。

## 🌟 主要特性

- **🔄 单例模式** - 避免重复连接，优化资源使用
- **🧹 自动清理** - 进程退出时自动关闭所有连接
- **🔧 统一管理** - 集中管理多种MCP和API客户端
- **⚡ 按需连接** - 客户端懒加载，提升启动性能
- **🛡️ 错误恢复** - 完善的错误处理和重连机制

## 📋 支持的服务

### 1. Puppeteer MCP
- **功能**: 本地Chrome浏览器自动化
- **命令**: `npx -y puppeteer-mcp-server`
- **用途**: 网页抓取、表单填充、页面截图、UI测试

### 2. Google Maps MCP
- **功能**: Google地图服务
- **命令**: `npx -y @modelcontextprotocol/server-google-maps`
- **环境变量**: `GOOGLE_MAP_API_KEY`
- **用途**: 地址查询、路线规划、地理编码

### 3. Exa MCP
- **功能**: 高级搜索服务
- **命令**: `npx -y exa-mcp-server`
- **环境变量**: `EXA_API_KEY`
- **用途**: 网页搜索、研究论文、公司信息、竞争对手分析

## 🚀 快速开始

### 基础用法

```typescript
import mcpClientManager from '@/lib/mcp/client-manager';

// 获取客户端状态
const status = mcpClientManager.getStatus();
console.log('可用客户端:', status.availableClients);

// 获取Puppeteer客户端
const puppeteerClient = await mcpClientManager.getPuppeteerMCPClient();

// 获取Puppeteer工具
const puppeteerTools = await mcpClientManager.getPuppeteerMCPTools();
```

### 使用Puppeteer工具

```typescript
import { puppeteerTool } from '@/lib/tools/puppeteer-tool';

const tool = puppeteerTool();

// 1. 连接到浏览器
await tool.execute({
  action: 'connect_active_tab'
}, { toolCallId: "test", messages: [] });

// 2. 导航到网站
await tool.execute({
  action: 'navigate',
  url: 'https://example.com'
}, { toolCallId: "test", messages: [] });

// 3. 截图
await tool.execute({
  action: 'screenshot',
  name: 'homepage'
}, { toolCallId: "test", messages: [] });
```

## 🛠️ Puppeteer设置

### Chrome浏览器设置

使用Puppeteer工具前，需要启动Chrome并开启远程调试：

**Windows:**
```bash
chrome.exe --remote-debugging-port=9222
```

**Mac:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222
```

### 验证设置

访问 `http://localhost:9222` 检查远程调试是否正常工作。

## 🎯 Puppeteer工具操作

### 连接和导航
```typescript
// 连接到活动标签页
await tool.execute({ 
  action: 'connect_active_tab' 
}, { toolCallId: "test", messages: [] });

// 连接到特定URL的标签页
await tool.execute({ 
  action: 'connect_active_tab',
  targetUrl: 'https://example.com'
}, { toolCallId: "test", messages: [] });

// 导航到新URL
await tool.execute({ 
  action: 'navigate',
  url: 'https://example.com'
}, { toolCallId: "test", messages: [] });
```

### 页面截图
```typescript
// 全页面截图
await tool.execute({ 
  action: 'screenshot',
  name: 'fullpage',
  width: 1200,
  height: 800
}, { toolCallId: "test", messages: [] });

// 元素截图
await tool.execute({ 
  action: 'screenshot',
  name: 'element',
  selector: '.main-content'
}, { toolCallId: "test", messages: [] });
```

### 页面交互
```typescript
// 点击元素
await tool.execute({ 
  action: 'click',
  selector: '#submit-button'
}, { toolCallId: "test", messages: [] });

// 填充输入框
await tool.execute({ 
  action: 'fill',
  selector: '#username',
  value: 'user@example.com'
}, { toolCallId: "test", messages: [] });

// 选择下拉菜单
await tool.execute({ 
  action: 'select',
  selector: '#country',
  value: 'china'
}, { toolCallId: "test", messages: [] });

// 鼠标悬停
await tool.execute({ 
  action: 'hover',
  selector: '.menu-item'
}, { toolCallId: "test", messages: [] });
```

### JavaScript执行
```typescript
// 获取页面信息
await tool.execute({ 
  action: 'evaluate',
  script: 'return document.title'
}, { toolCallId: "test", messages: [] });

// 复杂操作
await tool.execute({ 
  action: 'evaluate',
  script: `
    return {
      title: document.title,
      url: window.location.href,
      links: document.querySelectorAll('a').length
    }
  `
}, { toolCallId: "test", messages: [] });
```

## 🔧 API参考

### MCPClientManager

#### 方法

- `getInstance()` - 获取单例实例
- `getMCPClient(clientName)` - 获取指定MCP客户端
- `getMCPTools(clientName, schemas?)` - 获取MCP工具
- `closeMCPClient(clientName)` - 关闭指定客户端
- `reconnectClient(clientName)` - 重连客户端
- `getStatus()` - 获取状态信息
- `isClientConnected(clientName)` - 检查连接状态

#### 快捷方法

- `getPuppeteerMCPClient()` - 获取Puppeteer客户端
- `getPuppeteerMCPTools()` - 获取Puppeteer工具
- `getGoogleMapsMCPClient()` - 获取Google Maps客户端
- `getGoogleMapsMCPTools(schemas?)` - 获取Google Maps工具
- `getExaMCPClient()` - 获取Exa客户端
- `getExaMCPTools()` - 获取Exa工具

### PuppeteerTool

#### 支持的操作

- `connect_active_tab` - 连接到活动标签页
- `navigate` - 导航到URL
- `screenshot` - 页面截图
- `click` - 点击元素
- `fill` - 填充输入框
- `select` - 选择下拉菜单
- `hover` - 鼠标悬停
- `evaluate` - 执行JavaScript

## 📁 文件结构

```
lib/mcp/
├── client-manager.ts          # MCP客户端管理器
└── README.md                  # 本文档

lib/tools/
└── puppeteer-tool.ts          # Puppeteer AI SDK工具

examples/
└── puppeteer-usage.ts         # MCP连接测试示例

types/
└── mcp.ts                     # MCP相关类型定义
```

## 🧪 测试

### 运行MCP连接测试
```bash
pnpm test:mcp-connection
```
这会运行MCP服务器和客户端管理器的连接测试，验证：
- MCP客户端初始化
- 工具可用性检查
- 连接状态验证
- 资源清理功能

**注意**: 这个测试不包含实际的浏览器操作，仅测试MCP基础连接功能。

### 手动浏览器操作测试
对于实际的浏览器自动化功能测试，请：

1. **启动Chrome浏览器**：
   ```bash
   # Mac
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   
   # Windows  
   chrome.exe --remote-debugging-port=9222
   ```

2. **在代码中使用工具**：
   ```typescript
   import { puppeteerTool } from '@/lib/tools/puppeteer-tool';
   
   const tool = puppeteerTool();
   await tool.execute({ 
     action: 'connect_active_tab' 
   }, { toolCallId: "test", messages: [] });
   ```

### 直接运行测试
```bash
# MCP连接测试
npx tsx examples/puppeteer-usage.ts
```

## 🐛 故障排除

### Puppeteer连接问题

**错误**: `Could not connect to Chrome`

**解决方案**:
1. 确保Chrome已启动并开启远程调试
2. 检查端口9222是否被占用
3. 确认防火墙设置
4. 尝试访问 `http://localhost:9222` 验证

### 环境变量问题

**错误**: `缺少必需的环境变量`

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确认环境变量名称正确
3. 重启应用程序以加载新的环境变量

### MCP服务启动问题

**错误**: MCP服务启动失败

**解决方案**:
1. 确认网络连接正常
2. 检查是否安装了必需的依赖
3. 尝试手动运行MCP命令
4. 查看控制台输出获取详细错误信息

## 📖 相关文档

- [Puppeteer MCP API文档](../../docs/API_DOCUMENTATION_CN.md)
- [AI SDK 工具文档](https://sdk.vercel.ai/docs/ai-sdk-ui/tools)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个模块！