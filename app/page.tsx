'use client'

import { useState, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import FaceOptionsPanel from '@/components/FaceOptionsPanel'
import ResultViewer from '@/components/ResultViewer'
import BeforeAfterView from '@/components/BeforeAfterView'
import { FaceOptions } from '@/lib/prompt'

const DEFAULT_OPTIONS: FaceOptions = {
  gender: 'male', age: 32,
  vibe: 'natural candid look',
  faceShape: 'oval face shape',
  skinTone: 'skin tone matching the original photo',
  skinDetail: 'healthy glowing skin',
  attractLevel: 2,
}

interface Result { b64: string | null; url: string | null }

type Step = 'step1' | 'step2' | 'done'

export default function Home() {
  const [step, setStep]                       = useState<Step>('step1')
  const [beforeFile, setBeforeFile]           = useState<File | null>(null)
  const [beforePreview, setBeforePreview]     = useState<string | null>(null)
  const [afterFile, setAfterFile]             = useState<File | null>(null)
  const [afterPreview, setAfterPreview]       = useState<string | null>(null)
  const [options, setOptions]                 = useState<FaceOptions>(DEFAULT_OPTIONS)
  const [count, setCount]                     = useState(2)
  const [step1Results, setStep1Results]       = useState<Result[]>([])
  const [selectedIndex, setSelectedIndex]     = useState(-1)
  const [finalBefore, setFinalBefore]         = useState<string | null>(null)
  const [finalAfter, setFinalAfter]           = useState<string | null>(null)
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  const handleBeforeImage = useCallback((file: File) => {
    setBeforeFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setBeforePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setStep1Results([])
    setSelectedIndex(-1)
    setError(null)
  }, [])

  const handleAfterImage = useCallback((file: File) => {
    setAfterFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setAfterPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setError(null)
  }, [])

  // STEP 1: 전사진 얼굴 생성
  const generateStep1 = useCallback(async () => {
    if (!beforeFile) return
    setLoading(true)
    setError(null)
    setStep1Results([])
    setSelectedIndex(-1)

    try {
      const fd = new FormData()
      fd.append('mode', 'step1')
      fd.append('image', beforeFile)
      fd.append('options', JSON.stringify(options))
      fd.append('count', String(count))

      const res  = await fetch('/api/generate', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.')
      setStep1Results(data.results)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [beforeFile, options, count])

  // STEP 2: 선택된 얼굴 → 후사진에 적용
  const generateStep2 = useCallback(async () => {
    if (!afterFile || selectedIndex < 0) return
    setLoading(true)
    setError(null)

    try {
      const selectedFace = step1Results[selectedIndex]
      if (!selectedFace?.b64) throw new Error('선택된 얼굴 데이터가 없습니다.')

      const fd = new FormData()
      fd.append('mode', 'step2')
      fd.append('image', afterFile)
      fd.append('selectedFace', selectedFace.b64)

      const res  = await fetch('/api/generate', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.')

      const afterResult = data.results[0]
      const afterSrc = afterResult.b64 ? `data:image/png;base64,${afterResult.b64}` : afterResult.url

      // 전사진 결과도 저장
      const beforeResult = step1Results[selectedIndex]
      const beforeSrc = beforeResult.b64 ? `data:image/png;base64,${beforeResult.b64}` : beforeResult.url

      setFinalBefore(beforeSrc)
      setFinalAfter(afterSrc)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [afterFile, selectedIndex, step1Results])

  const reset = useCallback(() => {
    setStep('step1')
    setBeforeFile(null); setBeforePreview(null)
    setAfterFile(null);  setAfterPreview(null)
    setStep1Results([]); setSelectedIndex(-1)
    setFinalBefore(null); setFinalAfter(null)
    setError(null)
  }, [])

  const downloadImg = (src: string, name: string) => {
    const link = document.createElement('a')
    link.href = src; link.download = name; link.click()
  }

  const stepLabel = step === 'step1' ? '1단계' : step === 'step2' ? '2단계' : '완료'
  const stepDesc  = step === 'step1' ? '전사진 업로드 & 얼굴 생성' : step === 'step2' ? '후사진 업로드 & 적용' : '전/후 결과 확인'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">SMP 얼굴 교체</h1>
              <p className="text-xs text-gray-400">두피문신 전후 사진 · 초상권 보호</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
            GPT Image API 연결됨
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
          {(['step1', 'step2', 'done'] as Step[]).map((s, i) => {
            const labels = ['1단계 · 전사진', '2단계 · 후사진', '완료']
            const isDone = step === 'done' || (step === 'step2' && i === 0)
            const isCurrent = step === s
            return (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isCurrent ? 'bg-violet-600 text-white' :
                  isDone && i < ['step1','step2','done'].indexOf(step) ? 'bg-violet-100 text-violet-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isDone && i < ['step1','step2','done'].indexOf(step) ? (
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                  {labels[i]}
                </div>
                {i < 2 && <div className="w-6 h-px bg-gray-200"></div>}
              </div>
            )
          })}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 pb-8">

        {/* ── DONE: 전/후 결과 ── */}
        {step === 'done' && finalBefore && finalAfter && (
          <BeforeAfterView
            beforeSrc={finalBefore}
            afterSrc={finalAfter}
            onDownloadBefore={() => downloadImg(finalBefore, 'smp-before.png')}
            onDownloadAfter={() => downloadImg(finalAfter, 'smp-after.png')}
            onReset={reset}
          />
        )}

        {/* ── STEP 1 & 2 ── */}
        {step !== 'done' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 왼쪽 */}
            <div className="space-y-6">

              {/* STEP 1: 전사진 업로드 + 옵션 */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-white bg-violet-600 px-2 py-0.5 rounded-full">1단계</span>
                  <h2 className="text-sm font-semibold text-gray-900">전사진 업로드</h2>
                </div>
                <UploadZone label="시술 전 사진" onFile={handleBeforeImage} preview={beforePreview} />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">얼굴 설정</h2>
                <FaceOptionsPanel options={options} onChange={setOptions} />
              </div>

              <div className="bg-violet-50 rounded-xl px-4 py-3 border border-violet-100">
                <p className="text-xs font-medium text-violet-700 mb-1.5">자동 적용 (고정)</p>
                <div className="flex flex-wrap gap-1.5">
                  {['한국인', '동아시아계', '대칭 얼굴', '자연스러운 조명 매칭', '두피 영역 보존'].map(t => (
                    <span key={t} className="text-xs bg-white text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>

              {/* STEP 2: 후사진 업로드 */}
              {step === 'step2' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-white bg-violet-600 px-2 py-0.5 rounded-full">2단계</span>
                    <h2 className="text-sm font-semibold text-gray-900">후사진 업로드</h2>
                  </div>
                  <UploadZone label="시술 후 사진" onFile={handleAfterImage} preview={afterPreview} />
                </div>
              )}
            </div>

            {/* 오른쪽 */}
            <div className="space-y-6">

              {/* STEP 1: 생성 설정 + 결과 */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-white bg-violet-600 px-2 py-0.5 rounded-full">1단계</span>
                  <h2 className="text-sm font-semibold text-gray-900">얼굴 생성</h2>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">생성 장수</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <button key={n} onClick={() => setCount(n)}
                        className={`py-2 rounded-lg text-sm border transition-all ${
                          count === n ? 'bg-violet-600 border-violet-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {n}장{n === 2 && <span className="text-xs ml-1 opacity-70">추천</span>}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">예상 비용: 약 ${(count * 0.034).toFixed(3)} / 회</p>
                </div>

                <button onClick={generateStep1} disabled={!beforeFile || loading}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    beforeFile && !loading ? 'bg-violet-600 hover:bg-violet-700 text-white active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading && step !== 'step2' ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>생성 중...</>
                  ) : (
                    <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>전사진 얼굴 생성하기</>
                  )}
                </button>

                {error && <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg"><p className="text-xs text-red-600">{error}</p></div>}
              </div>

              {/* 생성 결과 (선택 가능) */}
              {(step1Results.length > 0 || loading) && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <ResultViewer
                    results={step1Results}
                    onRegenerate={generateStep1}
                    loading={loading}
                    selectable={true}
                    selectedIndex={selectedIndex}
                    onSelect={(i) => {
                      setSelectedIndex(i)
                      setStep('step2')
                    }}
                  />
                </div>
              )}

              {/* STEP 2: 후사진 적용 버튼 */}
              {step === 'step2' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-white bg-violet-600 px-2 py-0.5 rounded-full">2단계</span>
                    <h2 className="text-sm font-semibold text-gray-900">후사진에 얼굴 적용</h2>
                  </div>

                  {selectedIndex >= 0 && (
                    <div className="mb-4 p-3 bg-violet-50 rounded-lg border border-violet-100">
                      <p className="text-xs text-violet-700">결과 {selectedIndex + 1} 얼굴이 후사진에 적용됩니다</p>
                    </div>
                  )}

                  <button onClick={generateStep2} disabled={!afterFile || selectedIndex < 0 || loading}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      afterFile && selectedIndex >= 0 && !loading ? 'bg-violet-600 hover:bg-violet-700 text-white active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>적용 중...</>
                    ) : (
                      <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>후사진에 동일 얼굴 적용하기</>
                    )}
                  </button>

                  {error && <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg"><p className="text-xs text-red-600">{error}</p></div>}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
