import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import sharp from 'sharp'
import { buildPrompt, FaceOptions } from '@/lib/prompt'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File
    const optionsRaw = formData.get('options') as string
    const count = parseInt(formData.get('count') as string || '2')

    if (!imageFile || !optionsRaw) {
      return NextResponse.json({ error: '이미지와 옵션이 필요합니다.' }, { status: 400 })
    }

    const options: FaceOptions = JSON.parse(optionsRaw)
    const prompt = buildPrompt(options)

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // 이미지를 1024x1024 PNG로 변환 (GPT Image API 요구사항)
    const processedBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer()

    // 얼굴 마스크 생성: 중앙 상단 얼굴 영역을 흰색(교체 대상), 나머지 검정(보존)
    const maskBuffer = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 255 },
      },
    })
      .composite([{
        input: await sharp({
          create: {
            width: 340,
            height: 400,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 },
          },
        }).png().toBuffer(),
        left: 342,
        top: 80,
      }])
      .png()
      .toBuffer()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const imageBlob = new Blob([new Uint8Array(processedBuffer)], { type: 'image/png' })
    const maskBlob  = new Blob([new Uint8Array(maskBuffer)],      { type: 'image/png' })
    const imageFileObj = new File([imageBlob], 'image.png', { type: 'image/png' })
    const maskFileObj  = new File([maskBlob],  'mask.png',  { type: 'image/png' })

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFileObj,
      mask: maskFileObj,
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
