import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import sharp from 'sharp'
import { buildPrompt, FaceOptions } from '@/lib/prompt'

export const maxDuration = 60

async function processImage(buffer: Buffer) {
  return sharp(buffer)
    .resize(1024, 1024, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer()
}

async function createMaskFromRect(
  x: number, y: number, w: number, h: number
) {
  const SIZE = 1024
  const px = Math.round(x * SIZE)
  const py = Math.round(y * SIZE)
  const pw = Math.round(w * SIZE)
  const ph = Math.round(h * SIZE)

  return sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 255 } },
  })
    .composite([{
      input: await sharp({
        create: { width: pw, height: ph, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
      }).png().toBuffer(),
      left: px, top: py,
    }])
    .png()
    .toBuffer()
}

function toFile(buffer: Buffer, name: string) {
  const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' })
  return new File([blob], name, { type: 'image/png' })
}

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData()
    const imageFile  = formData.get('image') as File
    const optionsRaw = formData.get('options') as string
    const count      = parseInt(formData.get('count') as string || '2')

    // 얼굴 좌표 (0~1 비율)
    const faceX = parseFloat(formData.get('faceX') as string || '0.31')
    const faceY = parseFloat(formData.get('faceY') as string || '0.05')
    const faceW = parseFloat(formData.get('faceW') as string || '0.38')
    const faceH = parseFloat(formData.get('faceH') as string || '0.50')

    if (!imageFile || !optionsRaw) {
      return NextResponse.json({ error: '이미지와 옵션이 필요합니다.' }, { status: 400 })
    }

    const options: FaceOptions = JSON.parse(optionsRaw)
    const prompt = buildPrompt(options)

    const imageBuffer     = Buffer.from(await imageFile.arrayBuffer())
    const processedBuffer = await processImage(imageBuffer)
    const maskBuffer      = await createMaskFromRect(faceX, faceY, faceW, faceH)

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: toFile(processedBuffer, 'image.png'),
      mask:  toFile(maskBuffer,      'mask.png'),
      prompt,
      n: Math.min(count, 3) as 1 | 2 | 3,
      size: '1024x1024',
      quality: 'high',
    })

    const results = (response.data ?? []).map((item: { b64_json?: string; url?: string }) => ({
      b64: item.b64_json || null,
      url: item.url || null,
    }))

    return NextResponse.json({ results, prompt })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
