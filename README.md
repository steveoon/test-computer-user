<h1 align="center">智能招聘助手</h1>

<p align="center">
  一个基于AI技术的智能招聘助手平台，帮助HR和求职者提升招聘效率和体验。
</p>

<p align="center">
  <a href="#功能特性"><strong>功能特性</strong></a> ·
  <a href="#本地开发"><strong>本地开发</strong></a> ·
  <a href="#配置说明"><strong>配置说明</strong></a> ·
  <a href="#部署指南"><strong>部署指南</strong></a>
</p>
<br/>

## 功能特性

### 🤖 智能对话助手
- **多轮对话能力**：支持上下文记忆的智能对话，理解用户意图并提供个性化回复
- **多模型支持**：集成Anthropic Claude、OpenAI GPT、Google Gemini、阿里通义千问等多个AI模型
- **智能分类**：自动识别和分类用户消息类型，提供针对性的回复策略

### 💼 招聘场景优化
- **简历分析**：智能解析和评估候选人简历，提取关键信息和匹配度分析
- **面试辅助**：提供面试问题建议和候选人评估维度
- **职位匹配**：基于岗位要求和候选人背景进行智能匹配推荐

### 🔧 可视化配置管理
- **品牌定制**：支持企业品牌信息、LOGO、联系方式等个性化配置
- **提示词管理**：可视化编辑系统提示词，支持不同场景的定制化配置
- **回复模板**：管理和编辑智能回复模板，支持导入导出功能
- **配置同步**：支持配置数据的导出、导入和重置，便于环境间迁移

### 📱 多平台集成
- **飞书机器人**：无缝集成飞书群聊，支持群内智能问答和通知推送
- **Web界面**：现代化的响应式Web界面，支持桌面和移动端访问
- **API接口**：提供标准REST API，方便第三方系统集成

### 🔒 数据安全与隐私
- **本地存储**：敏感配置数据支持本地存储，保护企业隐私
- **环境隔离**：支持开发、测试、生产环境的独立配置
- **访问控制**：配置管理页面支持访问权限控制

## 本地开发

### 环境要求
- Node.js 18+ 
- npm、yarn 或 pnpm 包管理器

### 快速开始

1. **克隆项目并安装依赖**
   ```bash
   git clone <repository-url>
   cd ai-sdk-computer-use
   npm install
   ```

2. **配置环境变量**
   
   创建 `.env.local` 文件并配置以下环境变量：
   ```bash
   # AI模型API密钥配置
   ANTHROPIC_API_KEY=your_anthropic_api_key
   OPENAI_API_KEY=your_openai_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   GEMINI_API_KEY=your_google_gemini_api_key
   DASHSCOPE_API_KEY=your_qwen_api_key

   # E2B沙箱环境（可选）
   E2B_API_KEY=your_e2b_api_key

   # 飞书机器人配置（可选）
   FEISHU_APP_ID=your_feishu_app_id
   FEISHU_APP_SECRET=your_feishu_app_secret
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   - 主应用: [http://localhost:3000](http://localhost:3000)
   - 配置管理页面: [http://localhost:3000/admin/config](http://localhost:3000/admin/config)

### 调试说明

#### 🔧 配置管理调试
1. 访问配置管理页面进行品牌信息、提示词等配置
2. 使用浏览器开发者工具查看本地存储中的配置数据
3. 配置修改后会实时生效，无需重启服务

#### 🤖 AI模型调试
1. 在配置管理页面切换不同的AI模型进行测试
2. 查看控制台日志了解模型调用情况
3. 使用不同的提示词模板测试模型响应效果

#### 📱 飞书集成调试
1. 确保飞书机器人配置正确
2. 使用ngrok等工具暴露本地服务用于webhook测试
3. 查看飞书开发者后台的事件日志

#### 🐛 常见问题排查
- **API密钥错误**: 检查 `.env.local` 文件中的API密钥配置
- **跨域问题**: 确保本地开发环境的CORS配置正确
- **配置不生效**: 清除浏览器本地存储后重新配置
- **模型调用失败**: 检查网络连接和API配额限制

## 配置说明

### AI提供商配置
系统支持多个AI提供商，您需要至少配置一个：

- **Anthropic Claude**: 需要 `ANTHROPIC_API_KEY`
- **OpenAI GPT**: 需要 `OPENAI_API_KEY` 
- **OpenRouter**: 需要 `OPENROUTER_API_KEY`
- **Google Gemini**: 需要 `GEMINI_API_KEY`
- **阿里通义千问**: 需要 `DASHSCOPE_API_KEY`

### 配置数据管理
- 所有配置数据存储在浏览器的 IndexedDB 中
- 支持配置数据的导出、导入和重置
- 生产环境建议定期备份配置数据

## 部署指南

### Vercel部署
点击下方按钮一键部署到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?project-name=智能招聘助手&repository-name=ai-recruitment-assistant)

### 自定义部署
1. 构建生产版本：`npm run build`
2. 启动生产服务：`npm start`
3. 配置反向代理和HTTPS证书
4. 设置环境变量和监控告警

## 贡献指南

欢迎提交Issue和Pull Request来改进项目功能或修复问题。

在提交代码前，请确保：
- 代码通过了所有测试
- 遵循了项目的代码规范
- 更新了相关文档
