'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface FaceRect {
  x: number      // 0~1 비율
  y: number
  width: number
  height: number
}

interface Props {
  imageSrc: string
  onFaceRect: (rect: FaceRect) => void
}

export default function FaceMaskEditor({ imageSrc, onFaceRect }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [rect, setRect]       = useState<FaceRect | null>(null)
  const [dragging, setDragging] = useState<string | null>(null) // 'move' | 'resize'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [detecting, setDetecting] = useState(true)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const imgRef = useRef<HTMLImageElement | null>(null)

  // 이미지 로드 & 얼굴 감지
  useEffect(() => {
    if (!imageSrc) return
    setDetecting(true)
    setRect(null)

    const img = new Image()
    img.onload = async () => {
      imgRef.current = img
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })

      try {
        // MediaPipe Face Detection 동적 로드
        const { FaceDetection } = await import('@mediapipe/face_detection')
        const fd = new FaceDetection({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        })
        fd.setOptions({ model: 'short', minDetectionConfidence: 0.5 })

        await new Promise<void>((resolve) => {
          fd.onResults((results: { detections: Array<{ boundingBox: { xCenter: number; yCenter: number; width: number; height: number } }> }) => {
            if (results.detections.length > 0) {
              const bb = results.detections[0].boundingBox
              // 얼굴 영역 약간 확장 (이마/턱 포함)
              const pad = 0.08
              const newRect: FaceRect = {
                x:      Math.max(0, bb.xCenter - bb.width  / 2 - pad),
                y:      Math.max(0, bb.yCenter - bb.height / 2 - pad * 2),
                width:  Math.min(1 - Math.max(0, bb.xCenter - bb.width / 2 - pad), bb.width  + pad * 2),
                height: Math.min(1 - Math.max(0, bb.yCenter - bb.height / 2 - pad * 2), bb.height + pad * 3),
              }
              setRect(newRect)
              onFaceRect(newRect)
            } else {
              // 얼굴 미감지 시 기본값
              const defaultRect: FaceRect = { x: 0.31, y: 0.05, width: 0.38, height: 0.50 }
              setRect(defaultRect)
              onFaceRect(defaultRect)
            }
            resolve()
          })
          fd.send({ image: img })
        })
      } catch {
        // MediaPipe 로드 실패 시 기본값
        const defaultRect: FaceRect = { x: 0.31, y: 0.05, width: 0.38, height: 0.50 }
        setRect(defaultRect)
        onFaceRect(defaultRect)
      }
      setDetecting(false)
    }
    img.src = imageSrc
  }, [imageSrc, onFaceRect])

  // Canvas에 마스크 그리기
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !rect) return

    const W = canvas.width
    const H = canvas.height
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)

    const rx = rect.x * W
    const ry = rect.y * H
    const rw = rect.width  * W
    const rh = rect.height * H

    // 어두운 오버레이
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, W, H)

    // 얼굴 영역 밝게
    ctx.clearRect(rx, ry, rw, rh)
    ctx.drawImage(img, rx, ry, rw, rh, rx, ry, rw, rh)

    // 테두리
    ctx.strokeStyle = '#7C3AED'
    ctx.lineWidth = 2
    ctx.strokeRect(rx, ry, rw, rh)

    // 모서리 핸들
    const hs = 8
    ctx.fillStyle = '#7C3AED'
    ;[[rx, ry], [rx+rw, ry], [rx, ry+rh], [rx+rw, ry+rh]].forEach(([hx, hy]) => {
      ctx.fillRect(hx - hs/2, hy - hs/2, hs, hs)
    })

    // 라벨
    ctx.fillStyle = '#7C3AED'
    ctx.fillRect(rx, ry - 22, 72, 20)
    ctx.fillStyle = 'white'
    ctx.font = '11px sans-serif'
    ctx.fillText('교체 영역', rx + 6, ry - 7)
  }, [rect, imgSize])

  const getRelPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const bounds = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - bounds.left) / bounds.width,
      y: (e.clientY - bounds.top)  / bounds.height,
    }
  }

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rect) return
    const pos = getRelPos(e)
    const inRect =
      pos.x >= rect.x && pos.x <= rect.x + rect.width &&
      pos.y >= rect.y && pos.y <= rect.y + rect.height
    if (inRect) {
      setDragging('move')
      setDragStart(pos)
    }
  }, [rect])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !rect) return
    const pos = getRelPos(e)
    const dx = pos.x - dragStart.x
    const dy = pos.y - dragStart.y
    const newRect: FaceRect = {
      x: Math.max(0, Math.min(1 - rect.width,  rect.x + dx)),
      y: Math.max(0, Math.min(1 - rect.height, rect.y + dy)),
      width:  rect.width,
      height: rect.height,
    }
    setRect(newRect)
    onFaceRect(newRect)
    setDragStart(pos)
  }, [dragging, rect, dragStart, onFaceRect])

  const onMouseUp = useCallback(() => setDragging(null), [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">얼굴 영역 확인 · 드래그로 조정 가능</p>
        {detecting && (
          <span className="text-xs text-violet-600 flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
            </svg>
            얼굴 감지 중...
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full rounded-xl cursor-move"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      {!detecting && rect && (
        <p className="text-xs text-gray-400 text-center">
          보라색 영역이 AI로 교체될 얼굴 부분입니다. 드래그로 위치를 조정하세요.
        </p>
      )}
    </div>
  )
}
