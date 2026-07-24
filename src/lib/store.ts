import { create } from 'zustand'

export type ChatMode = 'programming' | 'video' | 'image' | 'app-building' | 'url-to-android'

export type ModelOption = {
  id: string
  name: string
  description: string
  icon: string
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'glm-4', name: 'GLM-4', description: 'نموذج عام متقدم للمحادثة والتحليل', icon: '🧠' },
  { id: 'glm-4v', name: 'GLM-4V', description: 'نموذج بصري لتحليل الصور والفيديو', icon: '👁️' },
  { id: 'codegeex', name: 'CodeGeeX', description: 'نموذج متخصص في البرمجة والكود', icon: '💻' },
  { id: 'glm-4-long', name: 'GLM-4-Long', description: 'نموذج للمحادثات الطويلة والتحليل العميق', icon: '📚' },
]

// Recommended model per mode
export const MODE_MODEL_MAP: Record<ChatMode, string> = {
  programming: 'codegeex',
  video: 'glm-4v',
  image: 'glm-4v',
  'app-building': 'glm-4',
  'url-to-android': 'glm-4',
}

// Models available per mode
export const MODE_AVAILABLE_MODELS: Record<ChatMode, string[]> = {
  programming: ['codegeex', 'glm-4', 'glm-4-long'],
  video: ['glm-4v', 'glm-4'],
  image: ['glm-4v', 'glm-4'],
  'app-building': ['glm-4', 'codegeex', 'glm-4-long'],
  'url-to-android': ['glm-4', 'codegeex', 'glm-4-long'],
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: ChatMode
  timestamp: Date
  codeBlocks?: { language: string; code: string }[]
  imageUrl?: string
  isStreaming?: boolean
}

export type ChatSession = {
  id: string
  title: string
  messages: Message[]
  mode: ChatMode
  model: string
  createdAt: Date
}

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  activeMode: ChatMode
  activeModel: string
  isGenerating: boolean
  previewContent: string | null
  previewLanguage: string | null
  previewType: 'code' | 'image' | 'html' | null

  // Actions
  setActiveMode: (mode: ChatMode) => void
  setActiveModel: (model: string) => void
  createSession: () => string
  setActiveSession: (id: string) => void
  deleteSession: (id: string) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, content: string) => void
  setIsGenerating: (val: boolean) => void
  setPreviewContent: (content: string | null, language?: string | null, type?: 'code' | 'image' | 'html' | null) => void
  getActiveSession: () => ChatSession | undefined
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeMode: 'programming',
  activeModel: 'glm-4',
  isGenerating: false,
  previewContent: null,
  previewLanguage: null,
  previewType: null,

  setActiveMode: (mode) => set({ 
    activeMode: mode,
    // Auto-switch to recommended model for the mode
    activeModel: MODE_MODEL_MAP[mode],
  }),
  setActiveModel: (model) => set({ activeModel: model }),
  
  createSession: () => {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const session: ChatSession = {
      id,
      title: 'محادثة جديدة',
      messages: [],
      mode: get().activeMode,
      model: get().activeModel,
      createdAt: new Date(),
    }
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: id,
    }))
    return id
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  deleteSession: (id) => set((state) => ({
    sessions: state.sessions.filter((s) => s.id !== id),
    activeSessionId: state.activeSessionId === id 
      ? (state.sessions.length > 1 ? state.sessions.find(s => s.id !== id)?.id ?? null : null)
      : state.activeSessionId,
  })),

  addMessage: (message) => set((state) => {
    const sessionId = state.activeSessionId
    if (!sessionId) return state
    const sessions = state.sessions.map((s) => {
      if (s.id === sessionId) {
        const updatedMessages = [...s.messages, message]
        const title = s.messages.length === 0 
          ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
          : s.title
        return { ...s, messages: updatedMessages, title }
      }
      return s
    })
    return { sessions }
  }),

  updateMessage: (id, content) => set((state) => {
    const sessionId = state.activeSessionId
    if (!sessionId) return state
    const sessions = state.sessions.map((s) => {
      if (s.id === sessionId) {
        const messages = s.messages.map((m) => 
          m.id === id ? { ...m, content, isStreaming: false } : m
        )
        return { ...s, messages }
      }
      return s
    })
    return { sessions }
  }),

  setIsGenerating: (val) => set({ isGenerating: val }),

  setPreviewContent: (content, language = null, type = null) => set({
    previewContent: content,
    previewLanguage: language,
    previewType: type,
  }),

  getActiveSession: () => {
    const state = get()
    return state.sessions.find((s) => s.id === state.activeSessionId)
  },
}))
