import { NextRequest, NextResponse } from 'next/server'
import { generateAndroidProject, generateAppName, generatePackageName } from '@/lib/android-builder/project-generator'
import AdmZip from 'adm-zip'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, appName, packageName, localHtml, mode, orientation, fullscreen, allowNavigation } = body

    // Validate inputs
    if (mode === 'url-to-android' && !url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Generate project configuration
    const targetUrl = mode === 'url-to-android' ? url : 'local'
    const name = appName || (url ? generateAppName(url) : 'MyApp')
    const pkg = packageName || (url ? generatePackageName(url) : 'com.zai.webapp')

    const config = {
      appName: name,
      packageName: pkg,
      url: targetUrl,
      localHtml: localHtml || undefined,
      orientation: orientation || 'unspecified',
      fullscreen: fullscreen || false,
      allowNavigation: allowNavigation !== false,
      iconColor: '#4285F4',
    }

    // Generate all Android project files
    const projectFiles = generateAndroidProject(config)

    // Create ZIP file
    const zip = new AdmZip()
    const projectFolderName = name.replace(/\s+/g, '')

    for (const [filePath, content] of Object.entries(projectFiles)) {
      zip.addFile(`${projectFolderName}/${filePath}`, Buffer.from(content, 'utf-8'))
    }

    // Save ZIP to download directory
    const downloadDir = '/home/z/my-project/download'
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }

    const zipFileName = `${projectFolderName}-android-project.zip`
    const zipPath = path.join(downloadDir, zipFileName)
    zip.writeZip(zipPath)

    // Return the project info and download link
    return NextResponse.json({
      success: true,
      appName: name,
      packageName: pkg,
      url: targetUrl,
      zipFileName: zipFileName,
      downloadPath: `/download/${zipFileName}`,
      projectFiles: Object.keys(projectFiles),
      totalFiles: Object.keys(projectFiles).length,
      buildInstructions: {
        step1: 'فتح Android Studio',
        step2: 'اختيار "Open an existing project"',
        step3: 'تحديد مجلد المشروع المستخرج',
        step4: 'الضغط على Run أو Build → Build APK',
        step5: 'APK يظهر في: app/build/outputs/apk/debug/',
      },
    })
  } catch (error: unknown) {
    console.error('Build APK error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في بناء المشروع'
    return NextResponse.json({ 
      error: errorMessage,
      success: false,
    }, { status: 500 })
  }
}
