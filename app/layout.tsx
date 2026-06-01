import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SMP 얼굴 교체 | 두피문신 전후사진',
  description: '두피문신 전후 사진의 초상권 보호를 위한 AI 얼굴 교체 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
