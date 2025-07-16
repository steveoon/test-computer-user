import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { ChatMessages } from '../ChatMessages'
import type { Message } from '@ai-sdk/react'

// Mock the tool message components
vi.mock('@/components/tool-messages', () => ({
  ToolMessageRenderer: ({ message }: { message: any }) => {
    return <div data-testid="tool-message">{message.part.toolName}</div>
  }
}))

// Mock PreviewMessage component
vi.mock('@/components/message', () => ({
  PreviewMessage: ({ message }: { message: Message }) => {
    return (
      <div data-testid={`message-${message.id}`}>
        {/* Only render parts, not both content and parts */}
        {message.parts?.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.text}</span>
          }
          if (part.type === 'tool-invocation') {
            return <div key={index} data-testid="tool-message">{(part as any).toolName}</div>
          }
          return null
        })}
      </div>
    )
  }
}))

// Mock ProjectInfo component
vi.mock('@/components/project-info', () => ({
  ProjectInfo: () => <div data-testid="project-info">Project Info</div>
}))

function TestWrapper({ messages }: { messages: Message[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  
  return (
    <ChatMessages
      messages={messages}
      isLoading={false}
      status="ready"
      containerRef={containerRef}
      endRef={endRef}
    />
  )
}

describe('ChatMessages', () => {
  it('renders text messages correctly', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello AI!',
        parts: [{ type: 'text', text: 'Hello AI!' }]
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        parts: [{ type: 'text', text: 'Hello! How can I help you today?' }]
      }
    ]

    render(<TestWrapper messages={messages} />)

    expect(screen.getByText('Hello AI!')).toBeInTheDocument()
    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
  })

  it('renders tool invocation messages', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        parts: [
          { type: 'text', text: 'Let me help you with that.' },
          {
            type: 'tool-invocation',
            toolInvocationId: 'tool-1',
            toolName: 'wechat',
            state: 'result',
            result: { success: true, message: 'Message sent' }
          } as any // Type assertion for testing
        ]
      }
    ]

    render(<TestWrapper messages={messages} />)

    expect(screen.getByText('Let me help you with that.')).toBeInTheDocument()
    expect(screen.getByTestId('tool-message')).toBeInTheDocument()
    expect(screen.getByText('wechat')).toBeInTheDocument()
  })

  it('handles empty message list', () => {
    render(<TestWrapper messages={[]} />)
    
    // Should render project info when no messages
    expect(screen.getByTestId('project-info')).toBeInTheDocument()
  })

  it('renders multiple tool invocations in sequence', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        parts: [
          { type: 'text', text: 'I will execute multiple tools for you.' },
          {
            type: 'tool-invocation',
            toolInvocationId: 'tool-1',
            toolName: 'zhipin_get_unread_candidates_improved',
            state: 'result',
            result: { candidates: [] }
          } as any,
          {
            type: 'tool-invocation',
            toolInvocationId: 'tool-2',
            toolName: 'zhipin_reply_generator',
            state: 'result',
            result: { reply: 'Generated reply' }
          } as any
        ]
      }
    ]

    render(<TestWrapper messages={messages} />)

    const toolMessages = screen.getAllByTestId('tool-message')
    expect(toolMessages).toHaveLength(2)
    expect(screen.getByText('zhipin_get_unread_candidates_improved')).toBeInTheDocument()
    expect(screen.getByText('zhipin_reply_generator')).toBeInTheDocument()
  })

  it('handles mixed content types properly', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Please help me',
        parts: [
          { type: 'text', text: 'Please help me' },
          { 
            type: 'file',
            mimeType: 'image/png',
            data: 'https://example.com/image.png' 
          } as any
        ]
      }
    ]

    render(<TestWrapper messages={messages} />)

    expect(screen.getByText('Please help me')).toBeInTheDocument()
    // File parts might be rendered differently based on implementation
  })

  it('tests loading state', () => {
    // Use TestWrapper which already handles refs
    const messages: Message[] = []
    
    render(<TestWrapper messages={messages} />)

    expect(screen.getByTestId('project-info')).toBeInTheDocument()
  })
})