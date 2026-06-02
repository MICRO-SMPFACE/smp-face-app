'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface FaceRect {
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  imageSrc: string
  onFaceRect: (rect: FaceRect) => void
}

const DEFAULT_RECT: FaceRect = { x: 0.31, y: 0.05, width: 0.38, height: 0.50 }

export default function FaceMaskEditor({ imageSrc, onFaceRect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef    = useRef<HTMLImageElement | null>(null)
  const [rect, setRect]     = useState<FaceRect>(DEFAULT_RECT)
  const [mode, setMode]     = useState<'move' | 'draw'>('move')
  const [dragState, setDragState] = useState<{
    type: 'move' | 'draw' | null
    startX: number; startY: number
    origRect?: FaceRect
  }>({ type: null, startX: 0, startY: 0 })

  const applyRect = useCallback((r: FaceRect) => {
    setRect(r)
    onFaceRect(r)
  }, [onFaceRect])

  // 이미지 로드 → 기본 마스크 즉시 표시
  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      applyRect(DEFAULT_RECT)
    }
    img.src = imageSrc
  }, [imageSrc, applyRect])

  // Canvas 그리기
  useEffect(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return
    const W = canvas.width, H = canvas.height
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)

    const rx = rect.x * W, ry = rect.y * H
    const rw = rect.width * W, rh = rect.height * H

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, W, H)
    ctx.clearRect(rx, ry, rw, rh)
    ctx.drawImage(img, rx, ry, rw, rh, rx, ry, rw, rh)

    ctx.strokeStyle = '#7C3AED'
    ctx.lineWidth = 2.5
    ctx.strokeRect(rx, ry, rw, rh)

    const hs = 9
    ctx.fillStyle = '#7C3AED'
    ;[[rx,ry],[rx+rw,ry],[rx,ry+rh],[rx+rw,ry+rh]].forEach(([hx,hy]) => {
      ctx.fillRect(hx-hs/2, hy-hs/2, hs, hs)
    })

    ctx.fillStyle = '#7C3AED'
    ctx.fillRect(rx, ry - 24, 76, 22)
    ctx.fillStyle = 'white'
    ctx.font = '11px sans-serif'
    ctx.fillText('교체 영역', rx + 6, ry - 8)
  }, [rect])

  const getRelPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height }
  }

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getRelPos(e)
    if (mode === 'draw') {
      setDragState({ type: 'draw', startX: pos.x, startY: pos.y })
      return
    }
    const inRect = pos.x >= rect.x && pos.x <= rect.x + rect.width &&
                   pos.y >= rect.y && pos.y <= rect.y + rect.height
    if (inRect) setDragState({ type: 'move', startX: pos.x, startY: pos.y, origRect: rect })
  }, [mode, rect])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.type) return
    const pos = getRelPos(e)
    if (dragState.type === 'draw') {
      applyRect({
        x: Math.min(pos.x, dragState.startX),
        y: Math.min(pos.y, dragState.startY),
        width:  Math.abs(pos.x - dragState.startX),
        height: Math.abs(pos.y - dragState.startY),
      })
      return
    }
    if (dragState.type === 'move' && dragState.origRect) {
      const dx = pos.x - dragState.startX, dy = pos.y - dragState.startY
      applyRect({
        x: Math.max(0, Math.min(1 - dragState.origRect.width,  dragState.origRect.x + dx)),
        y: Math.max(0, Math.min(1 - dragState.origRect.height, dragState.origRect.y + dy)),
        width: dragState.origRect.width, height: dragState.origRect.height,
      })
    }
  }, [dragState, applyRect])

  const onMouseUp = useCallback(() => setDragState(p => ({ ...p, type: null })), [])

  const resetRect = () => applyRect(DEFAULT_RECT)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setMode('move')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              mode === 'move' ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            ✥ 이동
          </button>
          <button onClick={() => setMode('draw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              mode === 'draw' ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            ▭ 직접 그리기
          </button>
        </div>
        <button onClick={resetRect}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all">
          ↺ 초기화
        </button>
      </div>

      <canvas
        ref={canvasRef} width={400} height={400}
        className={`w-full rounded-xl ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-move'}`}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      />

      <p className="text-xs text-gray-400 text-center">
        {mode === 'draw'
          ? '드래그해서 교체할 얼굴 영역을 직접 그리세요'
          : '보라색 영역을 드래그해서 위치를 조정하세요'}
      </p>
    </div>
  )
}
