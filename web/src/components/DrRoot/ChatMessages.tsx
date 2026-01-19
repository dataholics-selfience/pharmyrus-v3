import { useEffect, useRef } from 'react'
import { Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageParser } from './MessageParser'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatMessagesProps {
  messages: Message[]
  loading?: boolean
  onAction?: (action: any) => void
}

export function ChatMessages({ messages, loading, onAction }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Welcome message if empty
  const showWelcome = messages.length === 0 && !loading

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {showWelcome && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-teal-100 flex items-center justify-center">
            <Bot className="h-10 w-10 text-teal-600" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Olá! Sou o Dr. Root 🤖</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Assistente especialista em patentes farmacêuticas. 
              Estou aqui para ajudá-lo a entender os dados do dashboard.
            </p>
            <div className="pt-4 space-y-2">
              <p className="text-xs font-medium text-teal-600">Perguntas sugeridas:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Quantas patentes foram encontradas?</p>
                <p>• Quais são as patentes preditas?</p>
                <p>• Quando expira a primeira patente?</p>
                <p>• Quem são os principais depositantes?</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <ChatBubble 
          key={message.id}
          message={message}
          onAction={onAction}
        />
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex-1 bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Dr. Root está pensando...
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

interface ChatBubbleProps {
  message: Message
  onAction?: (action: any) => void
}

function ChatBubble({ message, onAction }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn(
      "flex items-start gap-3",
      isUser && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-blue-100" : "bg-teal-100"
      )}>
        {isUser ? (
          <User className="h-5 w-5 text-blue-600" />
        ) : (
          <Bot className="h-5 w-5 text-teal-600" />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        "flex-1 rounded-lg p-3 max-w-[85%]",
        isUser 
          ? "bg-blue-600 text-white" 
          : "bg-muted"
      )}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MessageParser 
            content={message.content}
            onAction={onAction}
          />
        )}
        
        <p className={cn(
          "text-xs mt-2 opacity-70",
          isUser ? "text-blue-100" : "text-muted-foreground"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  )
}
