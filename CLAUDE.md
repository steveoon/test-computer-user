# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build production bundle
- `pnpm lint` - Run ESLint checks
- `pnpm start` - Start production server

### API Testing
- Visit `/test-llm-reply` - Web interface for testing LLM smart reply functionality
- `POST /api/test-llm-reply` - API endpoint for programmatic testing

## Architecture Overview

### Core Application Structure
This is a Next.js 15 AI recruitment assistant platform with the following key components:

**Multi-Provider AI Integration:**
- Primary: Anthropic Claude 3.7 Sonnet for computer use capabilities
- Secondary: Qwen models via `qwen-ai-provider` for smart reply generation
- Supports OpenAI and Google AI providers via AI SDK

**Configuration Management Architecture:**
- **Unified Config Service** (`lib/services/config.service.ts`) - Central configuration management using localforage
- **Three-tier data structure**: Brand data, System prompts, Reply prompts
- **Migration system** from hardcoded data to persistent storage via `ConfigInitializer` component
- **Zustand stores** for model configuration and state management

**Smart Reply System:**
- **Two-phase AI architecture**: Classification (generateObject) → Reply generation (generateText)
- **16 reply scenarios** with intelligent intent recognition (10 recruitment + 6 attendance)
- **Multi-brand support** with dynamic brand detection
- **Fallback mechanism** to rule-based engine when LLM fails

### Key Technical Components

**Desktop Automation (E2B Integration):**
- `lib/e2b/tool.ts` - Computer use tools with screen capture and interaction
- `@e2b/desktop` integration for sandbox environments
- Chinese input handling with IME support

**Authentication & Data:**
- Supabase integration for user authentication
- Local storage with localforage for configuration persistence
- Brand context system for multi-tenant support

**AI Models Configuration:**
- `lib/config/models.ts` - Centralized model registry
- `lib/model-registry/` - Dynamic model provider management
- Support for multiple AI providers with fallback chains

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
# AI Providers
ANTHROPIC_API_KEY=your_anthropic_key
DASHSCOPE_API_KEY=your_dashscope_key  # For Qwen models
OPENAI_API_KEY=your_openai_key  # Optional fallback

# E2B Desktop
E2B_API_KEY=your_e2b_key

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Data Flow Patterns

1. **Configuration Loading**: `ConfigInitializer` → `configService.getConfig()` → Components
2. **Smart Replies**: User message → `generateSmartReplyWithLLM()` → Classification → Reply generation
3. **Computer Use**: User action → E2B tools → Desktop interaction → Screenshot/result
4. **Model Selection**: `useModelConfigStore()` → Dynamic provider selection → AI SDK execution

When working with this codebase:
- Always check configuration state before accessing brand/prompt data
- Use the type definitions in `types/config.d.ts` for configuration interfaces
- Follow the two-phase AI pattern for new intelligent features
- Test Chinese input scenarios when modifying desktop automation