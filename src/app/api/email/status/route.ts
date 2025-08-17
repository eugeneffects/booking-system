/**
 * 이메일 설정 상태 확인 API
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 환경변수 디버깅을 위한 로그
    console.log('환경변수 체크:', {
      SMTP_USER: process.env.SMTP_USER ? '있음' : '없음',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '있음' : '없음',
      SMTP_HOST: process.env.SMTP_HOST,
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    })

    const status = {
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
      smtpUser: process.env.SMTP_USER ? '설정됨' : '미설정',
      smtpPassword: process.env.SMTP_PASSWORD ? '설정됨' : '미설정',
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || '587',
      fromName: process.env.EMAIL_FROM_NAME || '숙소예약 추첨 시스템',
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@company.com',
      // 디버깅 정보 추가
      debug: {
        nodeEnv: process.env.NODE_ENV,
        hasEnvFile: process.env.SMTP_USER !== undefined,
        allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('SMTP_') || key.startsWith('EMAIL_'))
      }
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('이메일 상태 확인 오류:', error)
    return NextResponse.json(
      { error: '이메일 상태를 확인할 수 없습니다.' },
      { status: 500 }
    )
  }
}
