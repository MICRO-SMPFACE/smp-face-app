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

async function createMaskFromRect(x: number, y: number, w: number, h: number) {
  const SIZE = 1024
  const px = Math.max(0, Math.round(x * SIZE))
  const py = Math.max(0, Math.round(y * SIZE))
  const pw = Math.min(SIZE - px, Math.round(w * SIZE))
  const ph = Math.min(SIZE - py, Math.round(h * SIZE))

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
    const mode       = formData.get('mode') as string // 'step1' | 'step2'
    const imageFile  = formData.get('image') as File
    const optionsRaw = formData.get('options') as string
    const count      = parseInt(formData.get('count') as string || '2')
    const faceX      = parseFloat(formData.get('faceX') as string || '0.31')
    const faceY      = parseFloat(formData.get('faceY') as string || '0.05')
    const faceW      = parseFloat(formData.get('faceW') as string || '0.38')
    const faceH      = parseFloat(formData.get('faceH') as string || '0.50')

    if (!imageFile) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const imageBuffer     = Buffer.from(await imageFile.arrayBuffer())
    const processedBuffer = await processImage(imageBuffer)
    const maskBuffer      = await createMaskFromRect(faceX, faceY, faceW, faceH)

    // ── STEP 1: 전사진 얼굴 생성 ──
    if (mode === 'step1') {
      if (!optionsRaw) return NextResponse.json({ error: '옵션이 필요합니다.' }, { status: 400 })
      const options: FaceOptions = JSON.parse(optionsRaw)
      const prompt = buildPrompt(options)

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
    }

    // ── STEP 2: 후사진 → 전사진 결과를 레퍼런스로 인페인팅 ──
    if (mode === 'step2') {
      if (!optionsRaw) return NextResponse.json({ error: '옵션이 필요합니다.' }, { status: 400 })
      const options: FaceOptions = JSON.parse(optionsRaw)

      // 전사진 결과 이미지 (레퍼런스)
      const refFile = formData.get('refImage') as File | null
      const refB64  = formData.get('refB64')  as string | null

      // 레퍼런스 얼굴 기반 프롬프트 - 동일 인물 강조
      const basePrompt = buildPrompt(options)
      const prompt = `${basePrompt}, same person as the reference face, identical facial features, consistent identity, same face structure and characteristics`

      let response
      if (refFile) {
        // 레퍼런스 이미지가 있으면 함께 전송
        const refBuffer  = Buffer.from(await refFile.arrayBuffer())
        const refProcessed = await processImage(refBuffer)

        response = await openai.images.edit({
          model: 'gpt-image-1',
          image: toFile(processedBuffer, 'image.png'),
          mask:  toFile(maskBuffer,      'mask.png'),
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'high',
        })
      } else if (refB64) {
        // b64 레퍼런스
        const refBuffer    = Buffer.from(refB64, 'base64')
        const refProcessed = await processImage(refBuffer)

        response = await openai.images.edit({
          model: 'gpt-image-1',
          image: toFile(processedBuffer, 'image.png'),
          mask:  toFile(maskBuffer,      'mask.png'),
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'high',
        })
        void refProcessed // 현재 GPT Image API는 단일 이미지 입력만 지원, 추후 확장
      } else {
        // 레퍼런스 없을 때 기본 처리
        response = await openai.images.edit({
          model: 'gpt-image-1',
          image: toFile(processedBuffer, 'image.png'),
          mask:  toFile(maskBuffer,      'mask.png'),
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'high',
        })
      }

      const results = (response.data ?? []).map((item: { b64_json?: string; url?: string }) => ({
        b64: item.b64_json || null,
        url: item.url || null,
      }))
      return NextResponse.json({ results, prompt })
    }

    return NextResponse.json({ error: '잘못된 mode입니다.' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
