import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, List } from 'lucide-react'

interface MessageParserProps {
  content: string
  onAction?: (action: any) => void
}

export function MessageParser({ content, onAction }: MessageParserProps) {
  // Parse message for action links
  // Format: [Text](#action:type:params)
  const parseContent = (text: string) => {
    const linkPattern = /\[([^\]]+)\]\(#(patent|patents-list|report):([^)]+)\)/g
    const parts: Array<{ type: 'text' | 'link'; content: string; action?: any }> = []
    
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = linkPattern.exec(text)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        })
      }

      // Add link
      const [fullMatch, linkText, actionType, params] = match
      parts.push({
        type: 'link',
        content: linkText,
        action: parseAction(actionType, params)
      })

      lastIndex = match.index + fullMatch.length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      })
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content: text }]
  }

  const parseAction = (type: string, params: string) => {
    switch (type) {
      case 'patent':
        return {
          type: 'patent',
          number: params,
          icon: ExternalLink
        }
      
      case 'patents-list':
        // Format: filter:title ou apenas filter
        const parts = params.split(':')
        const filter = parts[0]
        const title = parts.slice(1).join(':') || getTitleForFilter(filter)
        
        return {
          type: 'patents-list',
          filter,
          title,
          icon: List
        }
      
      case 'report':
        return {
          type: 'report',
          reportType: params,
          icon: FileText
        }
      
      default:
        return null
    }
  }

  const getTitleForFilter = (filter: string): string => {
    const titles: Record<string, string> = {
      'all': 'Todas as Patentes',
      'confirmed': 'Patentes Confirmadas',
      'predicted': 'Patentes Preditas',
      'expiring-soon': 'Patentes Expirando em Breve',
      'high-risk': 'Patentes de Alto Risco'
    }
    return titles[filter] || 'Lista de Patentes'
  }

  const parts = parseContent(content)

  return (
    <div className="text-sm space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {part.content}
            </span>
          )
        }

        if (part.type === 'link' && part.action) {
          const Icon = part.action.icon
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="mt-2 mb-2 mr-2 inline-flex items-center gap-2 bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700 hover:text-teal-800 font-medium shadow-sm"
              onClick={() => onAction?.(part.action)}
            >
              {part.content}
              {Icon && <Icon className="h-4 w-4" />}
            </Button>
          )
        }

        return null
      })}
    </div>
  )
}
