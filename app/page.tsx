'use client'

import { useState, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import FaceOptionsPanel from '@/components/FaceOptionsPanel'
import ResultViewer from '@/components/ResultViewer'
import { FaceOptions } from '@/lib/prompt'

const DEFAULT_OPTIONS: FaceOptions = {
  gender: 'male',
  age: 32,
  vibe: 'natural candid look',
  faceShape: 'oval face shape',
  skinTone: 'skin tone matching the original photo',
  skinDetail: 'healthy glowing skin',
  attractLevel: 2,
}

interface Result {
  b64: string | null
  url: string | null
}

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [options, setOptions] = useState<FaceOptions>(DEFAULT_OPTIONS)
  const [count, setCount] = useState(2)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedPrompt, setUsedPrompt] = useState<string | null>(null)

  const handleImage = useCallback((file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setResults([])
    setError(null)
  }, [])

  const generate = useCallback(async () => {
    if (!imageFile) return
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      fd.append('options', JSON.stringify(options))
      fd.append('count', String(count))

      const res = await fetch('/api/generate', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.')
      setResults(data.results)
      setUsedPrompt(data.prompt)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [imageFile, options, count])

  const canGenerate = !!imageFile && !loading

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">사진 업로드</h2>
              <UploadZone label="원본 사진" onFile={handleImage} preview={imagePreview} />
              {imageFile && (
                <p className="text-xs text-gray-400 mt-2 text-center">{imageFile.name}</p>
              )}
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
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">생성 설정</h2>
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">생성 장수</p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`py-2 rounded-lg text-sm border transition-all ${
                        count === n
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {n}장{n === 2 && <span className="text-xs ml-1 opacity-70">추천</span>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  예상 비용: 약 ${(count * 0.034).toFixed(3)} / 회
                </p>
              </div>

              <button
                onClick={generate}
                disabled={!canGenerate}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  canGenerate
                    ? 'bg-violet-600 hover:bg-violet-700 text-white active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                    </svg>
                    생성 중...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                    </svg>
                    얼굴 생성하기
                  </>
                )}
              </button>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              {results.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                  </svg>
                  <p className="text-sm mt-3">사진 업로드 후 생성하기를 누르세요</p>
                </div>
              ) : (
                <ResultViewer results={results} onRegenerate={generate} loading={loading} />
              )}
            </div>

            {usedPrompt && (
              <details className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <summary className="text-xs font-medium text-gray-400 cursor-pointer select-none">사용된 프롬프트 확인</summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-mono">{usedPrompt}</p>
              </details>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
