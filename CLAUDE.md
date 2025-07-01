# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build production bundle
- `pnpm lint` - Run ESLint checks
- `pnpm start` - Start production server
- `pnpm test:mcp-connection` - Test MCP connection using Puppeteer
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

### API Testing & Debugging
- Visit `/test-llm-reply` - Web interface for testing LLM smart reply functionality
- `POST /api/test-llm-reply` - API endpoint for programmatic testing
- `GET /api/diagnose` - E2B diagnostic tools for troubleshooting sandbox issues
- Visit `/admin/settings` - Configuration management interface
- Visit `/admin/config` - Legacy configuration interface (redirects to settings)

## Architecture Overview

### Core Application Structure
This is a Next.js 15 AI recruitment assistant platform with the following key components:

**Multi-Provider AI Integration:**
- Primary: Anthropic Claude Sonnet for computer use capabilities
- Secondary: Qwen models via `qwen-ai-provider` for smart reply generation
- Supports OpenAI, Google AI, and OpenRouter providers via AI SDK
- Dynamic model provider management through `lib/model-registry/`
- Provider caching to avoid recreating identical configurations

**Configuration Management Architecture:**
- **Unified Config Service** (`lib/services/config.service.ts`) - Central configuration management using localforage
- **Three-tier data structure**: Brand data, System prompts, Reply prompts
- **Migration system** from hardcoded data to persistent storage via `ConfigInitializer` component
- **Zustand stores** for model configuration and state management
- **LocalForage** for browser-based persistence (not localStorage) with IndexedDB fallback

**Smart Reply System:**
- **Two-phase AI architecture**: Classification (generateObject) → Reply generation (generateText)
- **16 reply scenarios** with intelligent intent recognition (10 recruitment + 6 attendance)
- **Multi-brand support** with dynamic brand detection via React Context
- **Fallback mechanism** to rule-based engine when LLM fails

### Key Technical Components

**Desktop Automation (E2B Integration):**
- `lib/e2b/tool.ts` - Computer use tools with screen capture and interaction
- `@e2b/desktop` integration for sandbox environments
- Chinese input handling with IME support
- Automatic resource cleanup on process termination

**Authentication & Data:**
- Supabase integration for user authentication with middleware
- Route-based protection with configurable public/protected routes
- Cookie-based session management with SSR support
- Graceful degradation when Supabase is not configured
- Brand context system for multi-tenant support using React Context

**AI Models Configuration:**
- `lib/config/models.ts` - Centralized model registry
- `lib/model-registry/` - Dynamic model provider management
- Support for multiple AI providers with fallback chains
- Runtime provider switching without code changes

**MCP (Model Context Protocol) Integration:**
- Singleton manager pattern for MCP client lifecycle
- Multiple MCP servers (Puppeteer, Google Maps, Exa) with unified interface
- Tool schema validation and type safety
- Lazy connection establishment for performance

## Important Development Notes

### Zod Schema-First Architecture
All data types and interfaces are derived from Zod schemas:
```typescript
// Define schema first
const schema = z.object({...})
// Derive types
type SchemaType = z.infer<typeof schema>
```
This ensures runtime validation and compile-time type safety throughout the application.

### Configuration System
- All configuration data flows through `configService` singleton
- Components use `ConfigInitializer` for automatic migration on first use
- Admin interface at `/admin/settings` for visual configuration management
- Never modify hardcoded data files - use the config service instead
- Automatic versioning and migration system handles schema upgrades
- Configuration data stored in browser IndexedDB via LocalForage

### Smart Reply Integration
- Main function: `generateSmartReplyWithLLM()` in `lib/loaders/zhipin-data.loader.ts`
- Uses structured classification with Zod schemas for type safety
- Supports conversation history for context-aware responses
- Always handles Chinese text with proper encoding

### Reply Classification Types
The system supports 16 distinct reply scenarios:
1. **Recruitment Types (1-10)**: Position inquiry, scheduling, rejection handling, etc.
2. **Attendance Types (11-16)**: Schedule queries, shift changes, time corrections

### E2B Computer Use
- Screen resolution fixed at 1024x768
- Chinese input requires special handling via input methods
- All desktop interactions go through `lib/e2b/tool.ts`
- Image compression handled by `compressImageServerV2()`

### State Management
- Zustand for client-side state (auth, desktop, model config)
- React Context for brand selection across components
- LocalForage for persistent configuration storage

### Testing Strategy
- Web UI testing at `/test-llm-reply` for manual QA
- API endpoint `/api/test-llm-reply` for automated testing
- E2B diagnostic tools via `/api/diagnose`

## Environment Configuration

Required environment variables:
```bash
# AI Providers (at least one required)
ANTHROPIC_API_KEY=your_anthropic_key
DASHSCOPE_API_KEY=your_dashscope_key  # For Qwen models
OPENAI_API_KEY=your_openai_key  # Optional fallback
OPENROUTER_API_KEY=your_openrouter_key  # Optional
GEMINI_API_KEY=your_google_gemini_key  # Optional

# E2B Desktop (for computer use features)
E2B_API_KEY=your_e2b_key

# Supabase (Optional - for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Feishu Integration (Optional)
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret
```

## Data Flow Patterns

1. **Configuration Loading**: `ConfigInitializer` → `configService.getConfig()` → Components
2. **Smart Replies**: User message → `generateSmartReplyWithLLM()` → Classification → Reply generation
3. **Computer Use**: User action → E2B tools → Desktop interaction → Screenshot/result
4. **Model Selection**: `useModelConfigStore()` → Dynamic provider selection → AI SDK execution
5. **Authentication Flow**: Middleware → Supabase Auth → Session Cookie → Protected Routes
6. **Sync Architecture**: External API → Server-side fetch → Client-side persistence via ConfigService

## Important Development Guidelines

When working with this codebase:
- Always check configuration state before accessing brand/prompt data
- Use the type definitions in `types/config.d.ts` for configuration interfaces
- Follow the two-phase AI pattern for new intelligent features
- Test Chinese input scenarios when modifying desktop automation

### Code Quality Standards
- **Zero tolerance for `any` types** - Use `unknown` and type narrowing instead
- **Schema-first architecture** - All data structures must derive from Zod schemas
- **Strict TypeScript** - Enable strict null checks and exhaustive dependency checking
- **Component props interfaces** - All components must have explicit prop type definitions
- **Error handling** - All async operations must include proper error handling
- **Performance considerations** - Avoid unnecessary re-renders and expensive calculations
- **Singleton services** - Core services use singleton pattern for resource efficiency
- **Hook-based composition** - Features encapsulated in custom hooks for reusability

### MCP (Model Context Protocol) Integration
- MCP server available at `lib/mcp/` for advanced tool integrations
- Puppeteer usage examples in `examples/` directory
- Test MCP connections using `pnpm test:mcp-connection`

### Multi-language Support
- Primary support for Chinese text processing and input
- Special handling for Chinese IME in E2B environments
- UTF-8 encoding considerations for all text operations
- Reference `docs/CHINESE_INPUT_GUIDE.md` for troubleshooting input issues

## Architectural Highlights

### Progressive Web App Capabilities
The application supports multiple operational modes:
- **Full mode**: With authentication, E2B desktop, and all features enabled
- **Standalone mode**: Without Supabase authentication for local development
- **Offline mode**: Using cached configurations from LocalForage
- **Degraded mode**: Fallback to rule-based systems when AI providers fail

### Service Architecture
- **Singleton Pattern**: Core services (`configService`, `mcpClientManager`) use singleton pattern
- **Lazy Loading**: MCP connections established only when needed
- **Resource Management**: Automatic cleanup prevents memory leaks
- **Error Boundaries**: Multiple levels of error handling from component to API

### Type Safety Patterns
```
API Response → Zod Schema Validation → TypeScript Types → React Components
```
- Runtime validation at all external data boundaries
- Compile-time type safety throughout the application
- Schema-derived types eliminating duplication

### Duliday Integration
The new sync system demonstrates clean architecture:
- Server-side data fetching without direct storage access
- Client-side data persistence through the config service
- Progress tracking with real-time updates
- History management in localStorage for audit trails