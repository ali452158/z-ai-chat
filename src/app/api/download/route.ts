import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DOWNLOAD_DIR = '/home/z/my-project/download'

export async function GET(request: NextRequest) {
  try {
    // Get the filename from query parameter
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('file')

    if (!filename) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 })
    }

    // Security: prevent directory traversal
    const sanitizedFilename = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '')
    const filePath = path.join(DOWNLOAD_DIR, sanitizedFilename)

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Determine content type based on extension
    const ext = path.extname(sanitizedFilename).toLowerCase()
    const contentType = ext === '.zip' ? 'application/zip'
      : ext === '.apk' ? 'application/vnd.android.package-archive'
      : ext === '.pdf' ? 'application/pdf'
      : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : ext === '.pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : 'application/octet-stream'

    // Return file with download headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
