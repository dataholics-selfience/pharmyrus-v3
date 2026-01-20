import { useState, useEffect } from 'react'
import { MessageSquare, X, Minimize2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  // Estados: closed, minimized, expanded
  // COMEÇA EXPANDED (totalmente aberto)
  const [panelState, setPanelState] = useState<'closed' | 'minimized' | 'expanded'>('expanded')
  
  const { 
    messages, 
    sendMessage, 
    loading,
    clearChat 
  } = useGroqChat(patentData)

  // Enviar mensagem de boas-vindas automática
  useEffect(() => {
    if (panelState !== 'closed' && messages.length === 0 && !loading) {
      // Pequeno delay para parecer natural
      setTimeout(() => {
        sendMessage('Olá! Faça uma breve apresentação sobre as patentes encontradas.')
      }, 1000)
    }
  }, [panelState])

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'patent':
        onPatentClick?.(action.number)
        break
      case 'patents-list':
        onPatentListClick?.(action.filter, action.title)
        break
      case 'report':
        onReportGenerate?.(action.reportType, action.data)
        break
    }
  }

  return (
    <>
      {/* Panel Semi-Aberto (Minimizado) */}
      {panelState === 'minimized' && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 shadow-2xl">
          <div className="bg-white border-l border-t border-b rounded-l-xl w-14 flex flex-col items-center py-4 gap-4">
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                 onClick={() => setPanelState('expanded')}>
              <span className="text-xl">🤖</span>
            </div>
            
            {/* Texto Vertical */}
            <div className="writing-mode-vertical text-xs font-medium text-muted-foreground rotate-180">
              Dr. Root
            </div>
            
            {/* Botão Expandir */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setPanelState('expanded')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Botão Fechar */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setPanelState('closed')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Button (quando fechado) */}
      {panelState === 'closed' && (
        <Button
          onClick={() => setPanelState('minimized')}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700 z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Panel Expandido (com overlay escuro) */}
      {panelState === 'expanded' && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
            onClick={() => setPanelState('minimized')}
          />
          
          {/* Chat Panel */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-50 flex flex-col shadow-2xl animate-in slide-in-from-right">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-teal-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Dr. Root</h2>
                    <Badge variant="secondary" className="text-xs">
                      Assistente de Patentes
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPanelState('minimized')}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPanelState('closed')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

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
          </div>
        </>
      )}
    </>
  )
}
