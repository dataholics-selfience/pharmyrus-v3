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
              variant="link"
              size="sm"
              className="h-auto p-0 text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
              onClick={() => onAction?.(part.action)}
            >
              {part.content}
              {Icon && <Icon className="h-3 w-3" />}
            </Button>
          )
        }

        return null
      })}
    </div>
  )
}
