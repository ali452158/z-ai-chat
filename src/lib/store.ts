import { create } from 'zustand'

export type ChatMode = 'programming' | 'video' | 'image' | 'app-building' | 'url-to-android'

export type ModelOption = {
  id: string
  name: string
  description: string
  icon: string
  category: 'text' | 'vision' | 'code' | 'image-gen' | 'video-gen' | 'thinking'
  isFree: boolean
  recommendedFor: string[]
}

// Default models (used before API fetch completes)
export const DEFAULT_MODELS: ModelOption[] = [
  { id: 'glm-4', name: 'GLM-4', description: 'نموذج عام متقدم للمحادثة والتحليل', icon: '🧠', category: 'text', isFree: true, recommendedFor: ['programming', 'app-building', 'url-to-android'] },
  { id: 'glm-4-flash', name: 'GLM-4-Flash', description: 'نموذج سريع مجاني', icon: '⚡', category: 'text', isFree: true, recommendedFor: ['programming', 'app-building', 'url-to-android'] },
  { id: 'glm-z1-flash', name: 'GLM-Z1-Flash', description: 'نموذج تفكير متقدم', icon: '💡', category: 'thinking', isFree: true, recommendedFor: ['programming', 'app-building'] },
  { id: 'glm-4v', name: 'GLM-4V', description: 'نموذج بصري', icon: '👁️', category: 'vision', isFree: true, recommendedFor: ['video', 'image'] },
  { id: 'glm-4v-flash', name: 'GLM-4V-Flash', description: 'نموذج بصري سريع', icon: '📸', category: 'vision', isFree: true, recommendedFor: ['video', 'image'] },
  { id: 'glm-4.7-flash', name: 'GLM-4.7-Flash', description: 'أحدث نموذج مجاني', icon: '🚀', category: 'text', isFree: true, recommendedFor: ['programming', 'app-building', 'url-to-android'] },
  { id: 'codegeex', name: 'CodeGeeX', description: 'نموذج متخصص في البرمجة', icon: '💻', category: 'code', isFree: true, recommendedFor: ['programming'] },
]

// Recommended model per mode (first matching model from the list)
export const MODE_MODEL_MAP: Record<ChatMode, string> = {
  programming: 'glm-4.7-flash',
  video: 'glm-4v-flash',
  image: 'glm-4v-flash',
  'app-building': 'glm-4',
  'url-to-android': 'glm-4',
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: ChatMode
  model?: string
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
  availableModels: ModelOption[]
  modelsLoaded: boolean

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
  fetchModels: () => Promise<void>
  getModelsForMode: (mode: ChatMode) => ModelOption[]
  getRecommendedModelForMode: (mode: ChatMode) => ModelOption | undefined
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeMode: 'programming',
  activeModel: 'glm-4.7-flash',
  isGenerating: false,
  previewContent: null,
  previewLanguage: null,
  previewType: null,
  availableModels: DEFAULT_MODELS,
  modelsLoaded: false,

  setActiveMode: (mode) => {
    const state = get()
    // Find best model for this mode from available models
    const modeModels = state.getModelsForMode(mode)
    const recommended = state.getRecommendedModelForMode(mode)
    // If current model is not available for this mode, switch to recommended
    const currentModelAvailable = modeModels.some(m => m.id === state.activeModel)
    set({ 
      activeMode: mode,
      activeModel: currentModelAvailable ? state.activeModel : (recommended?.id || MODE_MODEL_MAP[mode]),
    })
  },

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

  fetchModels: async () => {
    try {
      const response = await fetch('/api/models')
      const data = await response.json()
      const models: ModelOption[] = data.models || []
      if (models.length > 0) {
        set({ availableModels: models, modelsLoaded: true })
      }
    } catch (err) {
      console.error('Failed to fetch models:', err)
      // Keep default models
      set({ modelsLoaded: true })
    }
  },

  getModelsForMode: (mode) => {
    const state = get()
    return state.availableModels.filter(m => m.recommendedFor.includes(mode))
  },

  getRecommendedModelForMode: (mode) => {
    const state = get()
    const modeModels = state.getModelsForMode(mode)
    // Prefer models with recommended category match
    const preferredCategory = mode === 'programming' ? ['code', 'thinking', 'text'] :
      mode === 'video' || mode === 'image' ? ['vision'] :
      ['text', 'thinking']
    
    for (const cat of preferredCategory) {
      const found = modeModels.find(m => m.category === cat)
      if (found) return found
    }
    return modeModels[0]
  },
}))
