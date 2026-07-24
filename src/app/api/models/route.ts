import { NextRequest, NextResponse } from 'next/server'

// Cache for discovered models
let cachedModels: ModelInfo[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 1800000 // 30 min cache (shorter for faster discovery)

type ModelInfo = {
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
  actualModel?: string // the backend model it maps to
}

// ============================================================
// COMPREHENSIVE KNOWN MODEL DATABASE
// Based on Z.ai (智谱 BigModel) official documentation
// Includes: GLM-5.x, GLM-4.x, Turbo, Vision, Thinking,
//           CodeGeeX, CogView, CogVideoX, and more
// ============================================================

const KNOWN_FREE_MODELS: ModelInfo[] = [
  // ===== TEXT MODELS (FREE) =====
  {
    id: 'glm-4.7-flash',
    name: 'GLM-4.7-Flash',
    description: 'نموذج مجاني متقدم - 30B MoE للبرمجة والتحليل والتفكير',
    icon: '🚀',
    category: 'text',
    isFree: true,
    isOpenSource: true,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
    parameters: '30B MoE / 3B active',
  },
  {
    id: 'glm-4-flash',
    name: 'GLM-4-Flash',
    description: 'نموذج سريع مجاني للمحادثات والمهام العامة',
    icon: '⚡',
    category: 'text',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-4.5-flash',
    name: 'GLM-4.5-Flash',
    description: 'نموذج مجاني بتفكير عميق - سيتم استبداله ب4.7-Flash',
    icon: '💡',
    category: 'text',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-4-long',
    name: 'GLM-4-Long',
    description: 'نموذج مجاني لمعالجة النصوص الطويلة حتى 128K',
    icon: '📚',
    category: 'text',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-3-turbo',
    name: 'GLM-3-Turbo',
    description: 'نموذج توربو سريع مجاني للمهام البسيطة والاستعلامات',
    icon: '🔄',
    category: 'text',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building'],
    contextLength: '32K',
  },

  // ===== THINKING MODELS (FREE) =====
  {
    id: 'glm-z1-flash',
    name: 'GLM-Z1-Flash',
    description: 'نموذج تفكير مجاني سريع مع تحليل متقدم',
    icon: '💡',
    category: 'thinking',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-z1-flashx',
    name: 'GLM-Z1-FlashX',
    description: 'نموذج تفكير مجاني محسّن للتحليل العميق والاستنتاج',
    icon: '🔬',
    category: 'thinking',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['programming', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-z1-air',
    name: 'GLM-Z1-Air',
    description: 'نموذج تفكير مجاني خفيف للتحليل السريع',
    icon: '🪁',
    category: 'thinking',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building'],
    contextLength: '128K',
  },

  // ===== VISION MODELS (FREE) =====
  {
    id: 'glm-4.6v-flash',
    name: 'GLM-4.6V-Flash',
    description: 'أحدث نموذج بصري مجاني - 9B محسّن مع تفكير',
    icon: '🎯',
    category: 'vision',
    isFree: true,
    isOpenSource: true,
    recommendedFor: ['video', 'image'],
    contextLength: '128K',
    parameters: '9B',
  },
  {
    id: 'glm-4.1v-thinking-flash',
    name: 'GLM-4.1V-Thinking-Flash',
    description: 'نموذج بصري مجاني مع تفكير عميق للتحليل المعقد',
    icon: '🔍',
    category: 'vision',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['video', 'image'],
    contextLength: '128K',
  },
  {
    id: 'glm-4v-flash',
    name: 'GLM-4V-Flash',
    description: 'نموذج بصري سريع مجاني لتحليل الصور والفيديو',
    icon: '📸',
    category: 'vision',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['video', 'image'],
    contextLength: '128K',
  },

  // ===== IMAGE GENERATION (FREE) =====
  {
    id: 'cogview-3-flash',
    name: 'CogView-3-Flash',
    description: 'نموذج مجاني لتوليد الصور من الأوصاف النصية',
    icon: '🎨',
    category: 'image-gen',
    isFree: true,
    isOpenSource: false,
    recommendedFor: ['image'],
  },

  // ===== VIDEO GENERATION (FREE) =====
  {
    id: 'cogvideox-flash',
    name: 'CogVideoX-Flash',
    description: 'نموذج مجاني لتوليد الفيديو من الأوصاف النصية',
    icon: '🎬',
    category: 'video-gen',
    isFree: true,
    isOpenSource: true,
    recommendedFor: ['video'],
  },
]

// ============================================================
// PREMIUM / OPEN-SOURCE MODELS (may require paid access or are open-source weights)
// We include them all so the user can try them - the API will tell us if they work
// ============================================================

const KNOWN_PREMIUM_MODELS: ModelInfo[] = [
  // ===== FLAGSHIP GLM-5.x SERIES (OPEN-SOURCE) =====
  {
    id: 'glm-5.2',
    name: 'GLM-5.2',
    description: 'أحدث نموذج旗舰 - 1M سياق، تصنيف عالمي Top 3',
    icon: '🌟',
    category: 'text',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '1M',
    parameters: '754B+',
  },
  {
    id: 'glm-5.1',
    name: 'GLM-5.1',
    description: 'نموذج هندسة الذكاء المستقل - 754B مفتوح المصدر MIT',
    icon: '🏆',
    category: 'text',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '200K',
    parameters: '754B / 44B active MoE',
  },
  {
    id: 'glm-5',
    name: 'GLM-5',
    description: 'نموذج مفتوح المصدر - 745B للبرمجة والهندسة الذكية',
    icon: '🔥',
    category: 'text',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['programming', 'app-building'],
    contextLength: '200K',
    parameters: '745B / 44B active MoE',
  },

  // ===== GLM-4.x SERIES =====
  {
    id: 'glm-4-plus',
    name: 'GLM-4-Plus',
    description: 'نموذج متقدم Plus للتحليل والمحادثة المتعمقة',
    icon: '🧠',
    category: 'text',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
    actualModel: 'glm-4-plus',
  },
  {
    id: 'glm-4',
    name: 'GLM-4',
    description: 'نموذج عام GLM-4 للمحادثة والتحليل',
    icon: '🤖',
    category: 'text',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-4-air',
    name: 'GLM-4-Air',
    description: 'نموذج خفيف Air للمهام البسيطة والسريعة',
    icon: '🪶',
    category: 'text',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building'],
    contextLength: '128K',
  },
  {
    id: 'glm-4-airx',
    name: 'GLM-4-AirX',
    description: 'نموذج Air محسّن مع سرعة أعلى',
    icon: '💨',
    category: 'text',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building'],
    contextLength: '128K',
  },
  {
    id: 'glm-4-flashx',
    name: 'GLM-4-FlashX',
    description: 'نموذج Flash محسّن مع أداء أعلى',
    icon: '✨',
    category: 'text',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building'],
    contextLength: '128K',
  },

  // ===== GLM-4.7 SERIES =====
  {
    id: 'glm-4.7',
    name: 'GLM-4.7',
    description: 'نموذج متقدم 4.7 - النسخة الكاملة من 4.7-Flash',
    icon: '⭐',
    category: 'text',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-4.7-plus',
    name: 'GLM-4.7-Plus',
    description: 'نموذج 4.7 Plus محسّن بالتفكير العميق',
    icon: '💎',
    category: 'text',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'url-to-android'],
    contextLength: '128K',
  },

  // ===== THINKING PREMIUM =====
  {
    id: 'glm-z1-plus',
    name: 'GLM-Z1-Plus',
    description: 'نموذج تفكير Plus محسّن للتحليل المعقد',
    icon: '🧩',
    category: 'thinking',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'url-to-android'],
    contextLength: '128K',
  },
  {
    id: 'glm-z1',
    name: 'GLM-Z1',
    description: 'نموذج تفكير متقدم للتحليل العميق',
    icon: '🤔',
    category: 'thinking',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming', 'app-building'],
    contextLength: '128K',
  },

  // ===== VISION PREMIUM =====
  {
    id: 'glm-4.6v',
    name: 'GLM-4.6V',
    description: 'نموذج بصري متقدم - النسخة الكاملة من 4.6V-Flash',
    icon: '👁️',
    category: 'vision',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['video', 'image'],
    contextLength: '128K',
  },
  {
    id: 'glm-4.6v-plus',
    name: 'GLM-4.6V-Plus',
    description: 'نموذج بصري Plus مع تفكير عميق',
    icon: '🔎',
    category: 'vision',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['video', 'image'],
    contextLength: '128K',
  },
  {
    id: 'glm-4v-plus',
    name: 'GLM-4V-Plus',
    description: 'نموذج بصري Plus محسّن لتحليل الصور المعقد',
    icon: '🔭',
    category: 'vision',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['video', 'image'],
    contextLength: '128K',
  },
  {
    id: 'glm-4v',
    name: 'GLM-4V',
    description: 'نموذج بصري GLM-4V لتحليل الصور والفيديو',
    icon: '👁️‍🗨️',
    category: 'vision',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['video', 'image'],
    contextLength: '128K',
  },

  // ===== CODE MODELS =====
  {
    id: 'codegeex-4',
    name: 'CodeGeeX-4',
    description: 'نموذج برمجة متخصص مفتوح المصدر - 9B',
    icon: '💻',
    category: 'code',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['programming'],
    contextLength: '128K',
    parameters: '9B',
  },
  {
    id: 'codegeex4-all',
    name: 'CodeGeeX4-All',
    description: 'نموذج برمجة شامل مفتوح المصدر',
    icon: '⌨️',
    category: 'code',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['programming'],
  },
  {
    id: 'codegeex',
    name: 'CodeGeeX',
    description: 'نموذج برمجة CodeGeeX الكلاسيكي',
    icon: '🖥️',
    category: 'code',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['programming'],
  },
  {
    id: 'codegeex-plus',
    name: 'CodeGeeX-Plus',
    description: 'نموذج برمجة Plus محسّن',
    icon: '📋',
    category: 'code',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['programming'],
  },

  // ===== IMAGE GENERATION PREMIUM =====
  {
    id: 'cogview-3-plus',
    name: 'CogView-3-Plus',
    description: 'نموذج توليد صور Plus محسّن بجودة أعلى',
    icon: '🖼️',
    category: 'image-gen',
    isFree: false,
    isOpenSource: false,
    recommendedFor: ['image'],
  },

  // ===== VIDEO GENERATION PREMIUM =====
  {
    id: 'cogvideox-2',
    name: 'CogVideoX-2',
    description: 'نموذج توليد فيديو متقدم بجودة عالية',
    icon: '🎥',
    category: 'video-gen',
    isFree: false,
    isOpenSource: true,
    recommendedFor: ['video'],
  },
]

// Combine all known models
const ALL_KNOWN_MODELS: ModelInfo[] = [...KNOWN_FREE_MODELS, ...KNOWN_PREMIUM_MODELS]

// ============================================================
// AUTO-DISCOVERY ENGINE
// Uses web search + LLM parsing to find new models
// ============================================================

const SEARCH_QUERIES = [
  '智谱 BigModel 免费模型 2026 free models GLM complete list',
  'Z.ai 智谱 新模型发布 2026 GLM-5 GLM-5.1 GLM-5.2 new release',
  '智谱 开源模型 CogView CogVideo CodeGeeX 2026 open source MIT',
  'Zhipu AI BigModel platform all models text vision code 2026',
  '智谱 模型概览 GLM API model ID complete catalog 2026',
]

export async function GET(request: NextRequest) {
  const now = Date.now()

  // Check cache
  if (cachedModels && now - lastFetchTime < CACHE_DURATION) {
    return NextResponse.json({
      models: cachedModels,
      total: cachedModels.length,
      freeCount: cachedModels.filter(m => m.isFree).length,
      openSourceCount: cachedModels.filter(m => m.isOpenSource).length,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      source: 'cache',
    })
  }

  // Start with all known models
  let discoveredModels: ModelInfo[] = [...ALL_KNOWN_MODELS]

  // Try web search discovery for new models
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // Run multiple search queries to find new models
    const allSearchResults: Array<{ name: string; snippet: string; url: string }> = []

    for (const query of SEARCH_QUERIES) {
      try {
        const results = await zai.functions.invoke('web_search', {
          query,
          num: 8,
        })
        if (Array.isArray(results)) {
          allSearchResults.push(...results)
        }
      } catch {
        // Individual search failure - continue with others
      }
    }

    // Deduplicate search results
    const uniqueResults = allSearchResults.filter((r, i, arr) =>
      arr.findIndex(x => x.url === r.url) === i
    ).slice(0, 20)

    if (uniqueResults.length > 0) {
      // Use LLM to extract model IDs from search results
      const searchContext = uniqueResults
        .map((r: { name: string; snippet: string; url: string }) =>
          `${r.name}: ${r.snippet} (${r.url})`
        )
        .join('\n')

      try {
        const parseResponse = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a Z.ai/智谱 model catalog parser. Extract ALL model IDs mentioned in the search results that are available on the Z.ai (智谱/BigModel) platform. 

Return ONLY a JSON array of objects. Each object must have these EXACT fields:
- id: lowercase model ID string used in API calls (e.g. "glm-5.2", "glm-4.7-flash")
- name: display name (e.g. "GLM-5.2", "GLM-4.7-Flash")  
- description: brief Arabic description of what the model does
- icon: single emoji character
- category: one of "text", "vision", "code", "image-gen", "video-gen", "thinking"
- isFree: true if explicitly mentioned as free/免费, false otherwise
- isOpenSource: true if explicitly mentioned as open-source/开源, false otherwise
- contextLength: context window if mentioned (e.g. "128K", "1M")
- parameters: model size if mentioned (e.g. "754B", "30B MoE")

Focus on models NOT already in this known list: ${ALL_KNOWN_MODELS.map(m => m.id).join(', ')}

No explanation, just the JSON array.`,
            },
            {
              role: 'user',
              content: `Search results about Z.ai/智谱 models:\n${searchContext}\n\nExtract ALL new model IDs (not already known) and return as JSON array.`,
            },
          ],
          model: 'glm-4-flash',
        })

        const parsedContent = parseResponse.choices?.[0]?.message?.content || ''

        // Try to parse the LLM response as JSON
        const jsonMatch = parsedContent.match(/\[[\s\S]*?\]/)
        if (jsonMatch) {
          const newModels = JSON.parse(jsonMatch[0]) as ModelInfo[]
          const knownIds = new Set(ALL_KNOWN_MODELS.map(m => m.id.toLowerCase()))

          for (const model of newModels) {
            const normalizedId = (model.id || '').toLowerCase()
            if (!knownIds.has(normalizedId) && normalizedId && model.name) {
              discoveredModels.push({
                ...model,
                id: normalizedId,
                isFree: model.isFree ?? false,
                isOpenSource: model.isOpenSource ?? false,
                recommendedFor: model.recommendedFor || getRecommendedFor(model.category),
              })
              knownIds.add(normalizedId)
            }
          }
        }
      } catch (parseErr) {
        console.error('Failed to parse LLM model discovery response:', parseErr)
      }
    }
  } catch (err) {
    console.error('Model discovery failed, using known models:', err)
  }

  // Sort models: free first, then open-source, then premium
  discoveredModels.sort((a, b) => {
    if (a.isFree && !b.isFree) return -1
    if (!a.isFree && b.isFree) return 1
    if (a.isOpenSource && !b.isOpenSource) return -1
    if (!a.isOpenSource && b.isOpenSource) return 1
    return 0
  })

  // Update cache
  cachedModels = discoveredModels
  lastFetchTime = now

  return NextResponse.json({
    models: discoveredModels,
    total: discoveredModels.length,
    freeCount: discoveredModels.filter(m => m.isFree).length,
    openSourceCount: discoveredModels.filter(m => m.isOpenSource).length,
    lastUpdated: new Date(now).toISOString(),
    source: 'discovery',
  })
}

function getRecommendedFor(category: string): string[] {
  switch (category) {
    case 'text': return ['programming', 'app-building', 'url-to-android']
    case 'vision': return ['video', 'image']
    case 'code': return ['programming']
    case 'thinking': return ['programming', 'app-building']
    case 'image-gen': return ['image']
    case 'video-gen': return ['video']
    case 'multimodal': return ['programming', 'video', 'image']
    default: return ['programming']
  }
}
