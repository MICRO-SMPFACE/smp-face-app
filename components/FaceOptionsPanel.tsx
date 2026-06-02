'use client'

import { useState, useEffect } from 'react'
import { FaceOptions } from '@/lib/prompt'

interface Props {
  options: FaceOptions
  onChange: (opts: FaceOptions) => void
}

const VIBES = [
  { label: '자연스러운', value: 'natural candid look' },
  { label: '단정한',     value: 'neat and professional' },
  { label: '편안한',     value: 'relaxed casual' },
  { label: '활동적인',   value: 'active energetic' },
  { label: '세련된',     value: 'sophisticated stylish' },
]

const FACE_SHAPES = [
  { label: '갸름한', value: 'oval face shape' },
  { label: '둥근',   value: 'round face shape' },
  { label: '각진',   value: 'square jaw defined' },
  { label: '하트형', value: 'heart-shaped face' },
]

const SKIN_TONES = [
  { label: '원본 맞춤', value: 'skin tone matching the original photo' },
  { label: '밝은',      value: 'fair bright skin tone' },
  { label: '중간',      value: 'medium natural skin tone' },
  { label: '웜톤',      value: 'warm tan skin tone' },
]

const SKIN_DETAILS = [
  { label: '건강한 광채', value: 'healthy glowing skin' },
  { label: '깨끗한',      value: 'clear smooth skin' },
  { label: '자연스러운 결', value: 'natural skin texture' },
  { label: '약간의 주름', value: 'slight natural wrinkles' },
]

const ATTRACT_LABELS: Record<number, string> = {
  1: '자연스러운',
  2: '균형잡힌',
  3: '뚜렷한 미모',
}

// 연령대별 최적 프리셋
function getPreset(age: number): Partial<FaceOptions> {
  if (age < 30) return {
    vibe: 'natural candid look',
    faceShape: 'oval face shape',
    skinDetail: 'healthy glowing skin',
    skinTone: 'skin tone matching the original photo',
    attractLevel: 2,
  }
  if (age < 40) return {
    vibe: 'natural candid look',
    faceShape: 'oval face shape',
    skinDetail: 'healthy glowing skin',
    skinTone: 'skin tone matching the original photo',
    attractLevel: 2,
  }
  if (age < 50) return {
    vibe: 'neat and professional',
    faceShape: 'round face shape',
    skinDetail: 'natural skin texture',
    skinTone: 'skin tone matching the original photo',
    attractLevel: 2,
  }
  if (age < 60) return {
    vibe: 'relaxed casual',
    faceShape: 'round face shape',
    skinDetail: 'slight natural wrinkles',
    skinTone: 'skin tone matching the original photo',
    attractLevel: 1,
  }
  return {
    vibe: 'neat and professional',
    faceShape: 'round face shape',
    skinDetail: 'slight natural wrinkles',
    skinTone: 'skin tone matching the original photo',
    attractLevel: 1,
  }
}

function getPresetLabels(age: number) {
  const p = getPreset(age)
  const vibeLabel   = VIBES.find(v => v.value === p.vibe)?.label || ''
  const shapeLabel  = FACE_SHAPES.find(v => v.value === p.faceShape)?.label || ''
  const skinLabel   = SKIN_DETAILS.find(v => v.value === p.skinDetail)?.label || ''
  return { vibeLabel, shapeLabel, skinLabel }
}

function ChipGroup<T extends string>({
  items, value, onChange,
}: {
  items: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
            value === item.value
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function FaceOptionsPanel({ options, onChange }: Props) {
  const [advOpen, setAdvOpen] = useState(false)

  const set = <K extends keyof FaceOptions>(key: K, val: FaceOptions[K]) =>
    onChange({ ...options, [key]: val })

  // 연령대 변경 시 프리셋 자동 적용
  const handleAge = (age: number) => {
    const preset = getPreset(age)
    onChange({ ...options, age, ...preset })
  }

  const { vibeLabel, shapeLabel, skinLabel } = getPresetLabels(options.age)

  return (
    <div className="space-y-5">

      {/* 성별 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">성별</p>
        <ChipGroup
          items={[
            { label: '남성', value: 'male' },
            { label: '여성', value: 'female' },
            { label: '중성적', value: 'androgynous' },
          ]}
          value={options.gender}
          onChange={(v) => set('gender', v)}
        />
      </div>

      {/* 연령대 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          연령대 <span className="text-violet-600 font-semibold normal-case">{options.age}세</span>
        </p>
        <input
          type="range" min={20} max={65} step={1}
          value={options.age}
          onChange={(e) => handleAge(parseInt(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-xs text-gray-300 mt-1">
          <span>20대</span><span>30대</span><span>40대</span><span>50대</span><span>60대+</span>
        </div>
      </div>

      {/* 자동 적용 프리셋 표시 */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
          연령대 자동 최적화 설정
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">{vibeLabel} 분위기</span>
          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">{shapeLabel} 얼굴형</span>
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{skinLabel}</span>
          <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">원본 피부톤 맞춤</span>
        </div>
      </div>

      {/* 고급 설정 토글 */}
      <button
        onClick={() => setAdvOpen(!advOpen)}
        className="w-full py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/>
        </svg>
        {advOpen ? '고급 설정 닫기' : '고급 설정 열기 (직접 조정)'}
        <svg
          width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: advOpen ? 'rotate(180deg)' : '', transition: 'transform .2s' }}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>

      {/* 고급 설정 패널 */}
      {advOpen && (
        <div className="space-y-4 pt-2 border-t border-gray-100">

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">분위기</p>
            <ChipGroup items={VIBES} value={options.vibe} onChange={(v) => set('vibe', v)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">얼굴형</p>
            <ChipGroup items={FACE_SHAPES} value={options.faceShape} onChange={(v) => set('faceShape', v)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">피부톤</p>
            <ChipGroup items={SKIN_TONES} value={options.skinTone} onChange={(v) => set('skinTone', v)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">피부 특징</p>
            <ChipGroup items={SKIN_DETAILS} value={options.skinDetail} onChange={(v) => set('skinDetail', v)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              매력도 <span className="text-violet-600 font-semibold normal-case">{ATTRACT_LABELS[options.attractLevel]}</span>
            </p>
            <input
              type="range" min={1} max={3} step={1}
              value={options.attractLevel}
              onChange={(e) => set('attractLevel', parseInt(e.target.value) as 1 | 2 | 3)}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>자연스러운</span><span>균형잡힌</span><span>뚜렷한 미모</span>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
