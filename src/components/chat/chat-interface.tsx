'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore, ChatMode, AVAILABLE_MODELS } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Code2,
  Video,
  ImageIcon,
  Smartphone,
  Link,
  Send,
  Square,
  Trash2,
  MessageSquare,
  Plus,
  Bot,
  User,
  Loader2,
  PanelRightOpen,
  PanelRightClose,
  Settings,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const MODE_CONFIG: Record<ChatMode, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  programming: {
    label: 'برمجة',
    icon: <Code2 className="h-4 w-4" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    description: 'كتابة وتصحيح وتحسين الكود',
  },
  video: {
    label: 'فيديو',
    icon: <Video className="h-4 w-4" />,
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    description: 'تحليل وإنتاج الفيديو',
  },
  image: {
    label: 'صورة',
    icon: <ImageIcon className="h-4 w-4" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    description: 'توليد وتحليل الصور',
  },
  'app-building': {
    label: 'بناء تطبيقات',
    icon: <Smartphone className="h-4 w-4" />,
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    description: 'تصميم وبناء تطبيقات كاملة',
  },
  'url-to-android': {
    label: 'URL → Android',
    icon: <Link className="h-4 w-4" />,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    description: 'تحويل URL إلى تطبيق Android',
  },
}

function extractCodeBlocks(content: string) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: { language: string; code: string }[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    })
  }
  return blocks
}

export default function ChatInterface() {
  const store = useChatStore()
  const [inputValue, setInputValue] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSession = store.sessions.find((s) => s.id === store.activeSessionId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeSession?.messages])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || store.isGenerating) return

    let sessionId = store.activeSessionId
    if (!sessionId) {
      sessionId = store.createSession()
    }

    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user' as const,
      content: inputValue.trim(),
      mode: store.activeMode,
      timestamp: new Date(),
    }

    store.addMessage(userMessage)
    setInputValue('')
    store.setIsGenerating(true)

    const currentSession = store.sessions.find((s) => s.id === sessionId)
    const history = currentSession?.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })) || []

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue.trim(),
          mode: store.activeMode,
          model: store.activeModel,
          history: history.slice(-10), // Last 10 messages for context
        }),
      })

      const data = await response.json()

      const assistantMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant' as const,
        content: data.message,
        mode: store.activeMode,
        timestamp: new Date(),
        codeBlocks: extractCodeBlocks(data.message),
      }

      store.addMessage(assistantMessage)

      // Update preview with code blocks
      const blocks = extractCodeBlocks(data.message)
      if (blocks.length > 0) {
        const firstBlock = blocks[0]
        store.setPreviewContent(
          firstBlock.code,
          firstBlock.language,
          firstBlock.language === 'html' ? 'html' : 'code'
        )
      }
    } catch (err) {
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant' as const,
        content: 'حدث خطأ في الاتصال. حاول مرة أخرى.',
        mode: store.activeMode,
        timestamp: new Date(),
      }
      store.addMessage(errorMessage)
    } finally {
      store.setIsGenerating(false)
    }
  }, [inputValue, store])

  const handlePreviewCode = (code: string, language: string) => {
    store.setPreviewContent(
      code,
      language,
      language === 'html' ? 'html' : 'code'
    )
    setShowPreview(true)
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-l border-border bg-card flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">المحادثات</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => store.createSession()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Session List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {store.sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  store.activeSessionId === session.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-muted-foreground'
                }`}
                onClick={() => store.setActiveSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="text-sm truncate flex-1">{session.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    store.deleteSession(session.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Sidebar Footer - Model Selection */}
        <div className="p-4 border-t border-border">
          <label className="text-xs text-muted-foreground mb-1.5 block">النموذج</label>
          <Select
            value={store.activeModel}
            onValueChange={store.setActiveModel}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.icon}</span>
                    <span className="font-medium">{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2 text-xs text-muted-foreground">
            {AVAILABLE_MODELS.find(m => m.id === store.activeModel)?.description}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-13 border-b border-border flex items-center px-4 gap-3 bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>

          {/* Active Model Badge */}
          <Badge variant="outline" className="text-xs">
            {AVAILABLE_MODELS.find(m => m.id === store.activeModel)?.icon}
            {AVAILABLE_MODELS.find(m => m.id === store.activeModel)?.name}
          </Badge>

          {/* Mode Tabs */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {(Object.entries(MODE_CONFIG) as [ChatMode, typeof MODE_CONFIG[ChatMode]][]).map(([mode, config]) => (
              <Button
                key={mode}
                variant={store.activeMode === mode ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 gap-1.5 text-xs ${
                  store.activeMode === mode ? config.color : 'text-muted-foreground'
                }`}
                onClick={() => store.setActiveMode(mode)}
              >
                {config.icon}
                <span>{config.label}</span>
              </Button>
            ))}
          </div>

          {/* Preview Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>

        {/* Content Area: Chat + Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {!activeSession || activeSession.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">مساعد Z.ai الذكي</h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                      ابدأ محادثة جديدة باستخدام أحد الأوضاع المتاحة. اختر البرمجة أو الفيديو أو الصورة أو بناء التطبيقات أو تحويل URL.
                    </p>
                  </div>
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg">
                    {(Object.entries(MODE_CONFIG) as [ChatMode, typeof MODE_CONFIG[ChatMode]][]).map(([mode, config]) => (
                      <Button
                        key={mode}
                        variant="outline"
                        className={`h-auto p-3 gap-2 flex-col ${config.color}`}
                        onClick={() => store.setActiveMode(mode)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                          {config.icon}
                        </div>
                        <span className="text-xs font-medium">{config.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                activeSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-accent text-accent-foreground'
                    }`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[80%] space-y-2 ${
                      msg.role === 'user' ? 'text-left' : 'text-right'
                    }`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-card-foreground'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="markdown-content text-sm leading-relaxed">
                            <ReactMarkdown
                              components={{
                                code({ className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  const codeString = String(children).replace(/\n$/, '')
                                  if (match) {
                                    return (
                                      <div className="relative group my-3">
                                        <div className="flex items-center justify-between px-4 py-1.5 bg-muted rounded-t-lg text-xs text-muted-foreground">
                                          <span>{match[1]}</span>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5"
                                              onClick={() => handlePreviewCode(codeString, match[1])}
                                            >
                                              <PanelRightOpen className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5"
                                              onClick={() => navigator.clipboard.writeText(codeString)}
                                            >
                                              <Code2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <SyntaxHighlighter
                                          style={oneDark}
                                          language={match[1]}
                                          PreTag="div"
                                          customStyle={{
                                            margin: 0,
                                            borderRadius: '0 0 0.5rem 0.5rem',
                                            fontSize: '13px',
                                          }}
                                          {...props}
                                        >
                                          {codeString}
                                        </SyntaxHighlighter>
                                      </div>
                                    )
                                  }
                                  return (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                      {children}
                                    </code>
                                  )
                                },
                                p({ children }) {
                                  return <p className="mb-2 last:mb-0">{children}</p>
                                },
                                ul({ children }) {
                                  return <ul className="list-disc mb-2 space-y-1">{children}</ul>
                                },
                                ol({ children }) {
                                  return <ol className="list-decimal mb-2 space-y-1">{children}</ol>
                                },
                                li({ children }) {
                                  return <li className="text-sm">{children}</li>
                                },
                                h1({ children }) {
                                  return <h1 className="text-lg font-bold mb-2">{children}</h1>
                                },
                                h2({ children }) {
                                  return <h2 className="text-base font-bold mb-1.5">{children}</h2>
                                },
                                h3({ children }) {
                                  return <h3 className="text-sm font-semibold mb-1">{children}</h3>
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>

                      {/* Mode badge */}
                      {msg.role === 'assistant' && (
                        <Badge variant="outline" className={`text-xs ${MODE_CONFIG[msg.mode]?.color}`}>
                          {MODE_CONFIG[msg.mode]?.icon}
                          {MODE_CONFIG[msg.mode]?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Generating indicator */}
              {store.isGenerating && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">جارٍ إنشاء الرد...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-card">
              <div className="flex items-center gap-2">
                {/* Mode indicator */}
                <Badge variant="outline" className={`${MODE_CONFIG[store.activeMode]?.color} text-xs hidden sm:flex`}>
                  {MODE_CONFIG[store.activeMode]?.icon}
                  {MODE_CONFIG[store.activeMode]?.label}
                </Badge>

                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={`اكتب رسالتك... (${MODE_CONFIG[store.activeMode]?.label})`}
                    className="h-10 pr-10 rounded-xl"
                    disabled={store.isGenerating}
                  />
                </div>

                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || store.isGenerating}
                  className="h-10 rounded-xl gap-1.5"
                >
                  {store.isGenerating ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-[45%] border-l border-border bg-card flex flex-col overflow-hidden">
              {/* Preview Header */}
              <div className="h-13 border-b border-border flex items-center px-4 gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">لوحة المعاينة</span>
                {store.previewLanguage && (
                  <Badge variant="outline" className="text-xs">
                    {store.previewLanguage}
                  </Badge>
                )}
                {store.previewContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs ml-auto"
                    onClick={() => navigator.clipboard.writeText(store.previewContent || '')}
                  >
                    نسخ الكود
                  </Button>
                )}
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto">
                {store.previewContent ? (
                  store.previewType === 'html' ? (
                    <iframe
                      srcDoc={store.previewContent}
                      className="w-full h-full bg-white"
                      sandbox="allow-scripts allow-same-origin"
                      title="HTML Preview"
                    />
                  ) : (
                    <SyntaxHighlighter
                      language={store.previewLanguage || 'text'}
                      style={oneDark}
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '13px',
                        minHeight: '100%',
                      }}
                    >
                      {store.previewContent}
                    </SyntaxHighlighter>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <Code2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">لا يوجد كود للمعاينة</p>
                      <p className="text-xs text-muted-foreground">اضغط على زر المعاينة في أي كود لعرضه هنا</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
