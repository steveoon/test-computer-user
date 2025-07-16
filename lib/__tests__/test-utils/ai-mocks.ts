import { 
  MockLanguageModelV1, 
  mockId 
} from 'ai/test'
import type { LanguageModelV1StreamPart } from 'ai'

// Convert array of chunks to a ReadableStream
function createMockStream<T>(chunks: T[], delay: number = 0): ReadableStream<T> {
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        controller.enqueue(chunk)
      }
      controller.close()
    }
  })
}

interface MockToolCall {
  toolCallId: string
  toolName: string
  args: any
}

interface MockStreamOptions {
  includeUsage?: boolean
  delay?: number
  toolCalls?: MockToolCall[]
}

export function createMockTextStream(
  chunks: string[],
  options: MockStreamOptions = {}
): MockLanguageModelV1 {
  const { includeUsage = true, delay = 100, toolCalls = [] } = options

  return new MockLanguageModelV1({
    doStream: async () => {
      const streamChunks: LanguageModelV1StreamPart[] = []
      
      // Add text chunks
      chunks.forEach(chunk => {
        streamChunks.push({ type: 'text-delta', textDelta: chunk })
      })

      // Add tool calls if any
      toolCalls.forEach(({ toolCallId, toolName, args }) => {
        streamChunks.push({
          type: 'tool-call',
          toolCallType: 'function',
          toolCallId,
          toolName,
          args: JSON.stringify(args)
        })
      })

      // Add usage information
      if (includeUsage) {
        streamChunks.push({
          type: 'finish',
          finishReason: 'stop',
          usage: { promptTokens: 100, completionTokens: 50 }
        })
      }

      return {
        stream: createMockStream(streamChunks, delay),
        rawCall: { rawPrompt: null, rawSettings: {} }
      }
    }
  })
}

export function createMockToolCallStream(
  toolName: string,
  args: any,
  resultText: string = 'Tool executed successfully',
  delay: number = 100
): MockLanguageModelV1 {
  const toolCallId = mockId({ prefix: 'tool' })() // Get a unique ID

  return new MockLanguageModelV1({
    doStream: async () => {
      const streamChunks: LanguageModelV1StreamPart[] = [
        {
          type: 'tool-call',
          toolCallType: 'function',
          toolCallId,
          toolName,
          args: JSON.stringify(args)
        },
        { type: 'text-delta', textDelta: resultText },
        {
          type: 'finish',
          finishReason: 'stop',
          usage: { promptTokens: 100, completionTokens: 50 }
        }
      ]

      return {
        stream: createMockStream(streamChunks, delay),
        rawCall: { rawPrompt: null, rawSettings: {} }
      }
    }
  })
}

export function createMockErrorStream(error: Error): MockLanguageModelV1 {
  return new MockLanguageModelV1({
    doStream: async () => {
      throw error
    }
  })
}

// Mock for generateObject (used in classification)
export function createMockObjectGeneration<T>(object: T): MockLanguageModelV1 {
  return new MockLanguageModelV1({
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: 'stop',
      usage: { promptTokens: 50, completionTokens: 20 },
      object: object as any,
      text: JSON.stringify(object)
    })
  })
}

// Helper to create mock model registry
export function createMockModelRegistry(mockModel: MockLanguageModelV1) {
  return {
    languageModel: () => mockModel,
    textEmbeddingModel: () => null as any, // Type casting for test purposes
    imageModel: () => null as any // Required by ProviderRegistryProvider
  }
}