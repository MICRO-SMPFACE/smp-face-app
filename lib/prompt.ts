export interface FaceOptions {
  gender: 'male' | 'female' | 'androgynous'
  age: number
  vibe: string
  faceShape: string
  skinTone: string
  skinDetail: string
  attractLevel: 1 | 2 | 3
}

const FIXED_BASE = [
  'Korean person, East Asian features',
  'symmetrical face',
  'realistic photo, not AI-generated looking',
  'natural lighting matching the original photo',
  'seamless blend with scalp and hairline area',
  'not retouched',
  'candid photo quality',
]

const GENDER_MAP: Record<string, string> = {
  male: 'Korean male',
  female: 'Korean female',
  androgynous: 'Korean androgynous-looking person',
}

const VIBE_MAP: Record<string, string> = {
  'natural candid look': 'natural candid expression',
  'neat and professional': 'neat and professional appearance',
  'relaxed casual': 'relaxed casual look',
  'active energetic': 'active energetic appearance',
  'sophisticated stylish': 'sophisticated stylish look',
}

const FACE_SHAPE_MAP: Record<string, string> = {
  'oval face shape': 'oval face shape',
  'round face shape': 'round face shape',
  'square jaw defined': 'square jaw with defined features',
  'heart-shaped face': 'heart-shaped face',
}

const SKIN_TONE_MAP: Record<string, string> = {
  'skin tone matching the original photo': 'skin tone carefully matching the surrounding neck and ears in the original photo',
  'fair bright skin tone': 'fair bright skin tone',
  'medium natural skin tone': 'medium natural skin tone',
  'warm tan skin tone': 'warm tan skin tone',
}

const SKIN_DETAIL_MAP: Record<string, string> = {
  'healthy glowing skin': 'healthy natural skin glow, visible pores',
  'clear smooth skin': 'clear smooth skin with natural texture',
  'natural skin texture': 'natural skin texture with subtle imperfections',
  'slight natural wrinkles': 'slight natural wrinkles appropriate for age',
}

const ATTRACT_MAP: Record<number, string> = {
  1: 'naturally attractive, realistic everyday appearance',
  2: 'well-balanced attractive features, photogenic appearance, bright clear eyes',
  3: 'strikingly attractive, well-defined facial structure, bright captivating eyes, sharp handsome features',
}

function getDecade(age: number): string {
  if (age < 27) return 'early to mid 20s'
  if (age < 33) return 'late 20s to early 30s'
  if (age < 38) return 'mid 30s'
  if (age < 43) return 'late 30s to early 40s'
  if (age < 48) return 'mid 40s'
  if (age < 53) return 'late 40s to early 50s'
  if (age < 58) return 'mid 50s'
  return 'late 50s to early 60s'
}

export function buildPrompt(opts: FaceOptions): string {
  const parts = [
    GENDER_MAP[opts.gender] || 'Korean person',
    `approximately ${getDecade(opts.age)}`,
    FACE_SHAPE_MAP[opts.faceShape] || opts.faceShape,
    VIBE_MAP[opts.vibe] || opts.vibe,
    SKIN_TONE_MAP[opts.skinTone] || opts.skinTone,
    SKIN_DETAIL_MAP[opts.skinDetail] || opts.skinDetail,
    ATTRACT_MAP[opts.attractLevel],
    ...FIXED_BASE,
  ]

  return parts.join(', ')
}

export function buildMaskPrompt(): string {
  return 'face area only, keep scalp, hair, neck, ears, and background exactly as original'
}
