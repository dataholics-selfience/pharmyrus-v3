import { useState } from 'react'
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { useGroqChat } from '@/hooks/useGroqChat'

interface ChatPanelProps {
  patentData: any
  onPatentClick?: (patentNumber: string) => void
  onPatentListClick?: (patents: any[], title: string) => void
  onReportGenerate?: (reportType: string, data: any) => void
}

export function ChatPanel({ 
  patentData, 
  onPatentClick,
  onPatentListClick,
  onReportGenerate 
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  
  const { 
    messages, 
    sendMessage, 
    loading,
    clearChat 
  } = useGroqChat(patentData)

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'patent':
        onPatentClick?.(action.number)
        break
      case 'patents-list':
        // Pass filter string to parent for processing
        onPatentListClick?.(action.filter, action.title)
        break
      case 'report':
        onReportGenerate?.(action.reportType, action.data)
        break
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700 z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className={cn(
            "w-full sm:w-[450px] p-0 flex flex-col",
            isMinimized && "h-20"
          )}
        >
          {/* Header */}
          <SheetHeader className="p-4 border-b bg-gradient-to-r from-teal-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold">Dr. Root</SheetTitle>
                  <Badge variant="secondary" className="text-xs">
                    Assistente de Patentes
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-hidden">
                <ChatMessages 
                  messages={messages}
                  loading={loading}
                  onAction={handleAction}
                />
              </div>

              {/* Input Area */}
              <div className="border-t bg-white p-4">
                <ChatInput 
                  onSend={sendMessage}
                  disabled={loading}
                  onClear={clearChat}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
