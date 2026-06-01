'use client'

interface Result {
  b64: string | null
  url: string | null
}

interface Props {
  results: Result[]
  onRegenerate: () => void
  loading: boolean
  selectable?: boolean
  selectedIndex?: number
  onSelect?: (index: number) => void
}

function downloadB64(b64: string, filename: string) {
  const link = document.createElement('a')
  link.href = `data:image/png;base64,${b64}`
  link.download = filename
  link.click()
}

export default function ResultViewer({
  results, onRegenerate, loading,
  selectable = false, selectedIndex = -1, onSelect,
}: Props) {
  if (results.length === 0 && !loading) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {selectable ? '마음에 드는 얼굴을 선택하세요' : '생성 결과'}
        </p>
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 disabled:opacity-40 transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          다시 생성
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 ${results.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {results.map((result, i) => {
            const src = result.b64 ? `data:image/png;base64,${result.b64}` : result.url || ''
            const isSelected = selectedIndex === i
            return (
              <div
                key={i}
                className={`group relative cursor-pointer ${selectable ? 'cursor-pointer' : ''}`}
                onClick={() => selectable && onSelect?.(i)}
              >
                <div className={`aspect-square rounded-xl overflow-hidden bg-gray-100 transition-all ${
                  selectable && isSelected ? 'ring-4 ring-violet-500 ring-offset-2' : ''
                } ${selectable ? 'hover:ring-2 hover:ring-violet-300 hover:ring-offset-1' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`결과 ${i + 1}`} className="w-full h-full object-cover" />
                </div>

                {/* 선택 체크 표시 */}
                {selectable && isSelected && (
                  <div className="absolute top-2 right-2 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center shadow-md">
                    <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </div>
                )}

                {/* 다운로드 버튼 (선택 불가 모드) */}
                {!selectable && (
                  <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-all flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => {
                        if (result.b64) downloadB64(result.b64, `smp-face-${i + 1}.png`)
                        else if (result.url) window.open(result.url, '_blank')
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                      </svg>
                      다운로드
                    </button>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-1.5">
                  {selectable ? (isSelected ? '✓ 선택됨' : `결과 ${i + 1}`) : `결과 ${i + 1}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {selectable && selectedIndex >= 0 && (
        <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg text-center">
          <p className="text-sm text-violet-700 font-medium">결과 {selectedIndex + 1} 선택됨 — 아래에서 후사진을 업로드하세요</p>
        </div>
      )}
    </div>
  )
}
