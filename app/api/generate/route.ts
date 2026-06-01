import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import sharp from 'sharp'
import { buildPrompt, FaceOptions } from '@/lib/prompt'

export const maxDuration = 60

function makeMask(width: number, height: number) {
  // 얼굴 영역: 이미지 중앙 상단 기준으로 마스크 생성
  const faceW = Math.round(width * 0.38)
  const faceH = Math.round(height * 0.48)
  const left  = Math.round((width - faceW) / 2)
  const top   = Math.round(height * 0.06)
  return { faceW, faceH, left, top }
}

async function processImage(buffer: Buffer) {
  return sharp(buffer)
    .resize(1024, 1024, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer()
}

async function createMask() {
  const { faceW, faceH, left, top } = makeMask(1024, 1024)
  return sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 255 } },
  })
    .composite([{
      input: await sharp({
        create: { width: faceW, height: faceH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
      }).png().toBuffer(),
      left, top,
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
    const formData = await req.formData()
    const mode      = formData.get('mode') as string // 'step1' | 'step2'
    const imageFile = formData.get('image') as File
    const optionsRaw = formData.get('options') as string
    const count     = parseInt(formData.get('count') as string || '2')
    // step2 전용: 선택된 얼굴 b64
    const selectedFaceB64 = formData.get('selectedFace') as string | null

    if (!imageFile) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const processedBuffer = await processImage(imageBuffer)
    const maskBuffer = await createMask()

    // ── STEP 1: 전사진 → 얼굴 2~3장 생성 ──
    if (mode === 'step1') {
      if (!optionsRaw) return NextResponse.json({ error: '옵션이 필요합니다.' }, { status: 400 })
      const options: FaceOptions = JSON.parse(optionsRaw)
      const prompt = buildPrompt(options)

      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: toFile(processedBuffer, 'image.png'),
        mask:  toFile(maskBuffer, 'mask.png'),
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
    }

    // ── STEP 2: 후사진 → 선택된 얼굴 그대로 적용 ──
    if (mode === 'step2') {
      if (!selectedFaceB64) return NextResponse.json({ error: '선택된 얼굴이 없습니다.' }, { status: 400 })

      // 선택된 얼굴 이미지에서 얼굴 영역만 크롭
      const faceBuffer = Buffer.from(selectedFaceB64, 'base64')
      const { faceW, faceH, left, top } = makeMask(1024, 1024)

      const faceCropBuffer = await sharp(faceBuffer)
        .extract({ left, top, width: faceW, height: faceH })
        .png()
        .toBuffer()

      // 후사진에 크롭된 얼굴 합성
      const compositeBuffer = await sharp(processedBuffer)
        .composite([{ input: faceCropBuffer, left, top }])
        .png()
        .toBuffer()

      const b64 = compositeBuffer.toString('base64')
      return NextResponse.json({
        results: [{ b64, url: null }],
        prompt: 'step2: 선택된 얼굴 직접 적용',
      })
    }

    return NextResponse.json({ error: '잘못된 mode입니다.' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
