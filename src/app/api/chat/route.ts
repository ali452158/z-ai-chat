import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, mode, model, history } = body

    // Build context based on mode
    let systemPrompt = ''
    switch (mode) {
      case 'programming':
        systemPrompt = 'أنت مساعد برمجة متخصص. تساعد في كتابة وتصحيح وتحسين الكود. اعرض الكود في blocks Markdown مع تحديد اللغة. اشرح الكود بالتفصيل.'
        break
      case 'video':
        systemPrompt = 'أنت مساعد متخصص في الفيديو. تساعد في تحليل ووصف الفيديو، وتقديم اقتراحات لإنتاج الفيديو وتحسينه.'
        break
      case 'image':
        systemPrompt = 'أنت مساعد متخصص في الصور. تساعد في تحليل ووصف الصور، وتوليد صور جديدة بناءً على الأوصاف.'
        break
      case 'app-building':
        systemPrompt = 'أنت مساعد متخصص في بناء تطبيقات الويب والموبايل. تساعد في تصميم وبناء تطبيقات كاملة من الصفر، بما في ذلك UI، Backend، Database. اعرض الكود في blocks Markdown.'
        break
      case 'url-to-android':
        systemPrompt = 'أنت مساعد متخصص في تحويل مواقع الويب إلى تطبيقات Android. تساعد في إنشاء تطبيقات Android من URLs، وتقديم إرشادات حول WebView، PWA، والأدوات اللازمة.'
        break
      default:
        systemPrompt = 'أنت مساعد ذكي عام. تساعد في مختلف المواضيع بأسلوب واضح ومفيد.'
    }

    // Prepare messages for the API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: message },
    ]

    const selectedModel = model || 'glm-4'

    // Use z-ai-web-dev-sdk ZAI class
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const response = await zai.chat.completions.create({
      messages,
      model: selectedModel,
    })

    const assistantMessage = response.choices?.[0]?.message?.content || 'لم أتمكن من إنشاء رد. حاول مرة أخرى.'

    return NextResponse.json({ 
      message: assistantMessage,
      model: selectedModel,
    })
  } catch (error: unknown) {
    console.error('Chat API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    
    // Parse body for fallback (request already consumed, so we re-read)
    let parsedBody: { mode?: string; message?: string; model?: string } = {}
    try {
      // The body was already consumed above, so we use a simplified fallback
      parsedBody = { mode: 'programming', message: '', model: 'glm-4' }
    } catch { /* ignore */ }
    
    const fallbackMessage = generateFallbackResponse(parsedBody?.mode || 'programming', parsedBody?.message || '')
    
    return NextResponse.json({ 
      message: fallbackMessage,
      model: parsedBody?.model || 'glm-4',
      isFallback: true,
      error: errorMessage,
    })
  }
}

function generateFallbackResponse(mode: string, userMessage: string): string {
  switch (mode) {
    case 'programming':
      return `أفهم أنك تريد مساعدة في البرمجة. إليك بعض النقاط:

\`\`\`javascript
// مثال توضيحي
function example() {
  console.log("مرحباً بالعالم!");
  return true;
}
\`\`\`

ملاحظة: هذا رد تجريبي بسبب خطأ في الاتصال بالخدمة. حاول إرسال رسالتك مرة أخرى.`
    case 'app-building':
      return `أفهم أنك تريد بناء تطبيق. إليك مثال على هيكل التطبيق:

\`\`\`html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تطبيق تجريبي</title>
</head>
<body>
  <h1>مرحباً بالتطبيق!</h1>
</body>
</html>
\`\`\`

ملاحظة: هذا رد تجريبي. حاول إرسال رسالتك مرة أخرى.`
    case 'url-to-android':
      return `لتحويل URL إلى تطبيق Android، إليك الخطوات الأساسية:

1. أنشئ مشروع Android جديد في Android Studio
2. استخدم WebView لعرض الموقع
3. أضف إعدادات PWA إذا كانت متاحة

\`\`\`java
WebView webView = new WebView(this);
webView.loadUrl("https://example.com");
\`\`\`

ملاحظة: هذا رد تجريبي. حاول إرسال رسالتك مرة أخرى.`
    default:
      return `شكراً على رسالتك. هذا رد تجريبي بسبب خطأ في الاتصال. حاول مرة أخرى.`
  }
}
