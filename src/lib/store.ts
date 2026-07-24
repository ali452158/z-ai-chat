import { create } from 'zustand'

export type ChatMode = 'programming' | 'video' | 'image' | 'app-building' | 'url-to-android'

export type ModelOption = {
  id: string
  name: string
  description: string
  icon: string
  category: 'text' | 'vision' | 'code' | 'image-gen' | 'video-gen' | 'thinking' | 'multimodal'
  isFree: boolean
  isOpenSource: boolean
  recommendedFor: string[]
  contextLength?: string
  parameters?: string
}

// Default models (used before API fetch completes) - comprehensive base list
export const DEFAULT_MODELS: ModelOption[] = [
  // FREE TEXT
  { id: 'glm-4.7-flash', name: 'GLM-4.7-Flash', description: 'نموذج مجاني متقدم - 30B MoE للبرمجة والتحليل', icon: '🚀', category: 'text', isFree: true, isOpenSource: true, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K', parameters: '30B MoE' },
  { id: 'glm-4-flash', name: 'GLM-4-Flash', description: 'نموذج سريع مجاني للمحادثات', icon: '⚡', category: 'text', isFree: true, isOpenSource: false, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-4.5-flash', name: 'GLM-4.5-Flash', description: 'نموذج مجاني بتفكير عميق', icon: '💡', category: 'text', isFree: true, isOpenSource: false, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-4-long', name: 'GLM-4-Long', description: 'نموذج مجاني للنصوص الطويلة 128K', icon: '📚', category: 'text', isFree: true, isOpenSource: false, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-3-turbo', name: 'GLM-3-Turbo', description: 'نموذج توربو سريع مجاني', icon: '🔄', category: 'text', isFree: true, isOpenSource: false, recommendedFor: ['programming', 'app-building'], contextLength: '32K' },

  // FREE THINKING
  { id: 'glm-z1-flash', name: 'GLM-Z1-Flash', description: 'نموذج تفكير مجاني سريع', icon: '💡', category: 'thinking', isFree: true, isOpenSource: false, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-z1-flashx', name: 'GLM-Z1-FlashX', description: 'نموذج تفكير مجاني محسّن', icon: '🔬', category: 'thinking', isFree: true, isOpenSource: false, recommendedFor: ['programming', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-z1-air', name: 'GLM-Z1-Air', description: 'نموذج تفكير خفيف مجاني', icon: '🪁', category: 'thinking', isFree: true, isOpenSource: false, recommendedFor: ['programming', 'app-building'], contextLength: '128K' },

  // FREE VISION
  { id: 'glm-4.6v-flash', name: 'GLM-4.6V-Flash', description: 'أحدث نموذج بصري مجاني 9B', icon: '🎯', category: 'vision', isFree: true, isOpenSource: true, recommendedFor: ['video', 'image'], contextLength: '128K', parameters: '9B' },
  { id: 'glm-4.1v-thinking-flash', name: 'GLM-4.1V-Thinking-Flash', description: 'نموذج بصري مجاني مع تفكير', icon: '🔍', category: 'vision', isFree: true, isOpenSource: false, recommendedFor: ['video', 'image'], contextLength: '128K' },
  { id: 'glm-4v-flash', name: 'GLM-4V-Flash', description: 'نموذج بصري سريع مجاني', icon: '📸', category: 'vision', isFree: true, isOpenSource: false, recommendedFor: ['video', 'image'], contextLength: '128K' },

  // FREE IMAGE/VIDEO GEN
  { id: 'cogview-3-flash', name: 'CogView-3-Flash', description: 'نموذج مجاني لتوليد الصور', icon: '🎨', category: 'image-gen', isFree: true, isOpenSource: false, recommendedFor: ['image'] },
  { id: 'cogvideox-flash', name: 'CogVideoX-Flash', description: 'نموذج مجاني لتوليد الفيديو', icon: '🎬', category: 'video-gen', isFree: true, isOpenSource: true, recommendedFor: ['video'] },

  // PREMIUM TEXT - GLM-5.x
  { id: 'glm-5.2', name: 'GLM-5.2', description: 'أحدث نموذج旗舰 - 1M سياق Top 3', icon: '🌟', category: 'text', isFree: false, isOpenSource: true, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '1M', parameters: '754B+' },
  { id: 'glm-5.1', name: 'GLM-5.1', description: 'نموذج هندسة الذكاء 754B مفتوح MIT', icon: '🏆', category: 'text', isFree: false, isOpenSource: true, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '200K', parameters: '754B MoE' },
  { id: 'glm-5', name: 'GLM-5', description: 'نموذج مفتوح المصدر 745B للبرمجة', icon: '🔥', category: 'text', isFree: false, isOpenSource: true, recommendedFor: ['programming', 'app-building'], contextLength: '200K', parameters: '745B MoE' },

  // PREMIUM TEXT - GLM-4.x
  { id: 'glm-4-plus', name: 'GLM-4-Plus', description: 'نموذج متقدم Plus', icon: '🧠', category: 'text', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-4', name: 'GLM-4', description: 'نموذج عام GLM-4', icon: '🤖', category: 'text', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-4-air', name: 'GLM-4-Air', description: 'نموذج خفيف Air', icon: '🪶', category: 'text', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'app-building'], contextLength: '128K' },
  { id: 'glm-4-airx', name: 'GLM-4-AirX', description: 'نموذج AirX محسّن', icon: '💨', category: 'text', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'app-building'], contextLength: '128K' },
  { id: 'glm-4-flashx', name: 'GLM-4-FlashX', description: 'نموذج FlashX محسّن', icon: '✨', category: 'text', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'app-building'], contextLength: '128K' },
  { id: 'glm-4.7', name: 'GLM-4.7', description: 'نموذج 4.7 النسخة الكاملة', icon: '⭐', category: 'text', isFree: false, isOpenSource: true, recommendedFor: ['programming', 'app-building', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-4.7-plus', name: 'GLM-4.7-Plus', description: 'نموذج 4.7 Plus محسّن', icon: '💎', category: 'text', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'url-to-android'], contextLength: '128K' },

  // PREMIUM THINKING
  { id: 'glm-z1-plus', name: 'GLM-Z1-Plus', description: 'نموذج تفكير Plus', icon: '🧩', category: 'thinking', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'url-to-android'], contextLength: '128K' },
  { id: 'glm-z1', name: 'GLM-Z1', description: 'نموذج تفكير متقدم', icon: '🤔', category: 'thinking', isFree: false, isOpenSource: false, recommendedFor: ['programming', 'app-building'], contextLength: '128K' },

  // PREMIUM VISION
  { id: 'glm-4.6v', name: 'GLM-4.6V', description: 'نموذج بصري 4.6V الكامل', icon: '👁️', category: 'vision', isFree: false, isOpenSource: true, recommendedFor: ['video', 'image'], contextLength: '128K' },
  { id: 'glm-4.6v-plus', name: 'GLM-4.6V-Plus', description: 'نموذج بصري Plus مع تفكير', icon: '🔎', category: 'vision', isFree: false, isOpenSource: false, recommendedFor: ['video', 'image'], contextLength: '128K' },
  { id: 'glm-4v-plus', name: 'GLM-4V-Plus', description: 'نموذج بصري Plus', icon: '🔭', category: 'vision', isFree: false, isOpenSource: false, recommendedFor: ['video', 'image'], contextLength: '128K' },
  { id: 'glm-4v', name: 'GLM-4V', description: 'نموذج بصري GLM-4V', icon: '👁️‍🗨️', category: 'vision', isFree: false, isOpenSource: false, recommendedFor: ['video', 'image'], contextLength: '128K' },

  // CODE
  { id: 'codegeex-4', name: 'CodeGeeX-4', description: 'نموذج برمجة متخصص مفتوح 9B', icon: '💻', category: 'code', isFree: false, isOpenSource: true, recommendedFor: ['programming'], contextLength: '128K', parameters: '9B' },
  { id: 'codegeex4-all', name: 'CodeGeeX4-All', description: 'نموذج برمجة شامل مفتوح', icon: '⌨️', category: 'code', isFree: false, isOpenSource: true, recommendedFor: ['programming'] },
  { id: 'codegeex', name: 'CodeGeeX', description: 'نموذج برمجة كلاسيكي', icon: '🖥️', category: 'code', isFree: false, isOpenSource: true, recommendedFor: ['programming'] },
  { id: 'codegeex-plus', name: 'CodeGeeX-Plus', description: 'نموذج برمجة Plus', icon: '📋', category: 'code', isFree: false, isOpenSource: false, recommendedFor: ['programming'] },

  // IMAGE/VIDEO GEN PREMIUM
  { id: 'cogview-3-plus', name: 'CogView-3-Plus', description: 'نموذج توليد صور Plus', icon: '🖼️', category: 'image-gen', isFree: false, isOpenSource: false, recommendedFor: ['image'] },
  { id: 'cogvideox-2', name: 'CogVideoX-2', description: 'نموذج توليد فيديو متقدم', icon: '🎥', category: 'video-gen', isFree: false, isOpenSource: true, recommendedFor: ['video'] },
]

// Recommended model per mode
export const MODE_MODEL_MAP: Record<ChatMode, string> = {
  programming: 'glm-4.7-flash',
  video: 'glm-4.6v-flash',
  image: 'glm-4.6v-flash',
  'app-building': 'glm-5.1',
  'url-to-android': 'glm-4.7-flash',
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

export type ApkBuildResult = {
  success: boolean
  appName: string
  packageName: string
  zipFileName: string
  downloadPath: string
  projectFiles: string[]
  totalFiles: number
  buildInstructions: Record<string, string>
}

// Category groupings for UI display
export const MODEL_CATEGORY_GROUPS = {
  text: { label: 'نماذج نصية', icon: '📝', color: 'bg-blue-500/10 text-blue-600' },
  thinking: { label: 'نماذج تفكير', icon: '💡', color: 'bg-purple-500/10 text-purple-600' },
  vision: { label: 'نماذج بصرية', icon: '👁️', color: 'bg-cyan-500/10 text-cyan-600' },
  code: { label: 'نماذج برمجة', icon: '💻', color: 'bg-emerald-500/10 text-emerald-600' },
  'image-gen': { label: 'توليد صور', icon: '🎨', color: 'bg-amber-500/10 text-amber-600' },
  'video-gen': { label: 'توليد فيديو', icon: '🎬', color: 'bg-rose-500/10 text-rose-600' },
  multimodal: { label: 'متعدد الأنماط', icon: '🔮', color: 'bg-violet-500/10 text-violet-600' },
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
  modelsLastUpdated: string | null
  modelDiscoveryStats: { total: number; free: number; openSource: number } | null
  apkBuild: ApkBuildResult | null
  apkBuilding: boolean

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
  getFreeModelsForMode: (mode: ChatMode) => ModelOption[]
  getPremiumModelsForMode: (mode: ChatMode) => ModelOption[]
  getRecommendedModelForMode: (mode: ChatMode) => ModelOption | undefined
  buildApk: (url?: string, localHtml?: string, appName?: string) => Promise<void>
  clearApkBuild: () => void
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
  modelsLastUpdated: null,
  modelDiscoveryStats: null,
  apkBuild: null,
  apkBuilding: false,

  setActiveMode: (mode) => {
    const state = get()
    const modeModels = state.getModelsForMode(mode)
    const recommended = state.getRecommendedModelForMode(mode)
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
        set({
          availableModels: models,
          modelsLoaded: true,
          modelsLastUpdated: data.lastUpdated,
          modelDiscoveryStats: {
            total: data.total || models.length,
            free: data.freeCount || models.filter(m => m.isFree).length,
            openSource: data.openSourceCount || models.filter(m => m.isOpenSource).length,
          },
        })
      }
    } catch (err) {
      console.error('Failed to fetch models:', err)
      set({ modelsLoaded: true })
    }
  },

  getModelsForMode: (mode) => {
    const state = get()
    return state.availableModels.filter(m => m.recommendedFor.includes(mode))
  },

  getFreeModelsForMode: (mode) => {
    const state = get()
    return state.availableModels.filter(m => m.recommendedFor.includes(mode) && m.isFree)
  },

  getPremiumModelsForMode: (mode) => {
    const state = get()
    return state.availableModels.filter(m => m.recommendedFor.includes(mode) && !m.isFree)
  },

  getRecommendedModelForMode: (mode) => {
    const state = get()
    const modeModels = state.getModelsForMode(mode)
    const preferredCategory = mode === 'programming' ? ['code', 'thinking', 'text'] :
      mode === 'video' || mode === 'image' ? ['vision', 'image-gen', 'video-gen'] :
      ['text', 'thinking', 'code']

    // First try free models
    for (const cat of preferredCategory) {
      const found = modeModels.find(m => m.category === cat && m.isFree)
      if (found) return found
    }
    // Then try any model in preferred categories
    for (const cat of preferredCategory) {
      const found = modeModels.find(m => m.category === cat)
      if (found) return found
    }
    return modeModels[0]
  },

  buildApk: async (url, localHtml, appName) => {
    set({ apkBuilding: true, apkBuild: null })
    try {
      const response = await fetch('/api/build-apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url || '',
          localHtml: localHtml || '',
          appName: appName || '',
          mode: get().activeMode,
        }),
      })
      const data = await response.json()
      if (data.success) {
        set({ apkBuild: data, apkBuilding: false })
      } else {
        set({ apkBuilding: false })
      }
    } catch (err) {
      console.error('Build APK error:', err)
      set({ apkBuilding: false })
    }
  },

  clearApkBuild: () => set({ apkBuild: null, apkBuilding: false }),
}))
