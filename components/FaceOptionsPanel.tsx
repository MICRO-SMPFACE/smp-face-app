'use client'

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
  const set = <K extends keyof FaceOptions>(key: K, val: FaceOptions[K]) =>
    onChange({ ...options, [key]: val })

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
          onChange={(e) => set('age', parseInt(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-xs text-gray-300 mt-1">
          <span>20대</span><span>30대</span><span>40대</span><span>50대</span><span>60대+</span>
        </div>
      </div>

      {/* 분위기 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">분위기</p>
        <ChipGroup items={VIBES} value={options.vibe} onChange={(v) => set('vibe', v)} />
      </div>

      {/* 얼굴형 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">얼굴형</p>
        <ChipGroup items={FACE_SHAPES} value={options.faceShape} onChange={(v) => set('faceShape', v)} />
      </div>

      {/* 피부톤 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">피부톤</p>
        <ChipGroup items={SKIN_TONES} value={options.skinTone} onChange={(v) => set('skinTone', v)} />
      </div>

      {/* 피부 특징 */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">피부 특징</p>
        <ChipGroup items={SKIN_DETAILS} value={options.skinDetail} onChange={(v) => set('skinDetail', v)} />
      </div>

      {/* 매력도 */}
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
  )
}
