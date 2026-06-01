'use client'

interface Props {
  beforeSrc: string
  afterSrc: string
  onDownloadBefore: () => void
  onDownloadAfter: () => void
  onReset: () => void
}

function downloadImg(src: string, filename: string) {
  const link = document.createElement('a')
  link.href = src
  link.download = filename
  link.click()
}

export default function BeforeAfterView({ beforeSrc, afterSrc, onDownloadBefore, onDownloadAfter, onReset }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">전 / 후 비교</p>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          처음부터 다시
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Before</span>
            <span className="text-xs text-gray-400">시술 전</span>
          </div>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={beforeSrc} alt="before" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
              <button
                onClick={onDownloadBefore}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-800 shadow-sm"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                다운로드
              </button>
            </div>
          </div>
        </div>

        {/* After */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white bg-violet-600 px-2 py-0.5 rounded-full">After</span>
            <span className="text-xs text-gray-400">시술 후</span>
          </div>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={afterSrc} alt="after" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
              <button
                onClick={onDownloadAfter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-800 shadow-sm"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 한번에 다운로드 */}
      <button
        onClick={() => {
          onDownloadBefore()
          setTimeout(() => onDownloadAfter(), 300)
        }}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        전/후 사진 모두 다운로드
      </button>
    </div>
  )
}
