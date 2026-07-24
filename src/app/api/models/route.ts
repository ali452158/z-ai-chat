import { NextRequest, NextResponse } from 'next/server'

// Cache for discovered models
let cachedModels: ModelInfo[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 3600000 // 1 hour cache

type ModelInfo = {
  id: string
  name: string
  description: string
  icon: string
  category: 'text' | 'vision' | 'code' | 'image-gen' | 'video-gen' | 'thinking'
  isFree: boolean
  recommendedFor: string[]
  actualModel?: string // the backend model it maps to
}

// Known free Z.ai models - this is our base that always works
// New models discovered via web search will be added to this
const KNOWN_FREE_MODELS: ModelInfo[] = [
  {
    id: 'glm-4',
    name: 'GLM-4',
    description: 'نموذج عام متقدم للمحادثة والتحليل',
    icon: '🧠',
    category: 'text',
    isFree: true,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
    actualModel: 'glm-4-plus',
  },
  {
    id: 'glm-4-flash',
    name: 'GLM-4-Flash',
    description: 'نموذج سريع مجاني للمحادثات والمهام العامة',
    icon: '⚡',
    category: 'text',
    isFree: true,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
  },
  {
    id: 'glm-z1-flash',
    name: 'GLM-Z1-Flash',
    description: 'نموذج ذكي سريع مع تفكير متقدم',
    icon: '💡',
    category: 'thinking',
    isFree: true,
    recommendedFor: ['programming', 'app-building'],
  },
  {
    id: 'glm-z1-flashx',
    name: 'GLM-Z1-FlashX',
    description: 'نموذج تفكير متقدم محسّن للتحليل العميق',
    icon: '🔬',
    category: 'thinking',
    isFree: true,
    recommendedFor: ['programming', 'url-to-android'],
  },
  {
    id: 'glm-4v',
    name: 'GLM-4V',
    description: 'نموذج بصري لتحليل الصور والفيديو',
    icon: '👁️',
    category: 'vision',
    isFree: true,
    recommendedFor: ['video', 'image'],
  },
  {
    id: 'glm-4v-flash',
    name: 'GLM-4V-Flash',
    description: 'نموذج بصري سريع مجاني لتحليل الصور',
    icon: '📸',
    category: 'vision',
    isFree: true,
    recommendedFor: ['video', 'image'],
  },
  {
    id: 'glm-4.1v-thinking-flash',
    name: 'GLM-4.1V-Thinking-Flash',
    description: 'نموذج بصري مع تفكير عميق مجاني',
    icon: '🔍',
    category: 'vision',
    isFree: true,
    recommendedFor: ['video', 'image'],
  },
  {
    id: 'glm-4.7-flash',
    name: 'GLM-4.7-Flash',
    description: 'أحدث نموذج مجاني - 30B MoE للبرمجة والتحليل',
    icon: '🚀',
    category: 'text',
    isFree: true,
    recommendedFor: ['programming', 'app-building', 'url-to-android'],
  },
  {
    id: 'glm-4.6v-flash',
    name: 'GLM-4.6V-Flash',
    description: 'أحدث نموذج بصري مجاني - 9B محسّن للتحليل',
    icon: '🎯',
    category: 'vision',
    isFree: true,
    recommendedFor: ['video', 'image'],
  },
  {
    id: 'codegeex',
    name: 'CodeGeeX',
    description: 'نموذج متخصص في البرمجة والكود',
    icon: '💻',
    category: 'code',
    isFree: true,
    recommendedFor: ['programming'],
  },
  {
    id: 'glm-3-turbo',
    name: 'GLM-3-Turbo',
    description: 'نموذج سريع للمهام البسيطة والاستعلامات',
    icon: '🔄',
    category: 'text',
    isFree: true,
    recommendedFor: ['programming', 'app-building'],
  },
]

export async function GET(request: NextRequest) {
  // Check cache
  const now = Date.now()
  if (cachedModels && now - lastFetchTime < CACHE_DURATION) {
    return NextResponse.json({
      models: cachedModels,
      total: cachedModels.length,
      lastUpdated: new Date(lastFetchTime).toISOString(),
      source: 'cache',
    })
  }

  // Try to discover new models via web search
  let discoveredModels: ModelInfo[] = [...KNOWN_FREE_MODELS]

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // Search for latest free Z.ai models
    const searchResults = await zai.functions.invoke('web_search', {
      query: 'Z.ai 智谱 free models 2026 free 免费模型 GLM complete list',
      num: 10,
    })

    // Use the LLM to parse search results and find new model names
    const searchContext = searchResults
      .slice(0, 5)
      .map((r: { name: string; snippet: string; url: string }) =>
        `${r.name}: ${r.snippet} (${r.url})`
      )
      .join('\n')

    const parseResponse = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a model catalog parser. Extract ALL model IDs/names mentioned in the search results that are free models on Z.ai (智谱). Return ONLY a JSON array of objects with fields: id (lowercase model ID), name (display name), description (brief Arabic description), icon (single emoji), category (text/vision/code/image-gen/video-gen/thinking). No explanation, just the JSON array.',
        },
        {
          role: 'user',
          content: `Search results about Z.ai free models:\n${searchContext}\n\nExtract ALL free model IDs and return as JSON array. Include models like GLM-4-Flash, GLM-4V-Flash, GLM-4.7-Flash, GLM-4.6V-Flash, GLM-Z1-Flash, CodeGeeX, etc.`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const parsedContent = parseResponse.choices?.[0]?.message?.content || ''

    // Try to parse the LLM response as JSON
    try {
      // Extract JSON from the response (might be wrapped in markdown)
      const jsonMatch = parsedContent.match(/\[[\s\S]*?\]/)
      if (jsonMatch) {
        const newModels = JSON.parse(jsonMatch[0]) as ModelInfo[]
        // Merge new models with known ones (avoid duplicates by id)
        const knownIds = new Set(KNOWN_FREE_MODELS.map(m => m.id))
        for (const model of newModels) {
          if (!knownIds.has(model.id) && model.id && model.name) {
            discoveredModels.push({
              ...model,
              isFree: true,
              recommendedFor: model.recommendedFor || getRecommendedFor(model.category),
            })
          }
        }
      }
    } catch (parseErr) {
      console.error('Failed to parse LLM model discovery response:', parseErr)
      // Keep only known models
    }
  } catch (err) {
    console.error('Model discovery failed, using known models:', err)
    // Fallback to known models only
  }

  // Update cache
  cachedModels = discoveredModels
  lastFetchTime = now

  return NextResponse.json({
    models: discoveredModels,
    total: discoveredModels.length,
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
    default: return ['programming']
  }
}
