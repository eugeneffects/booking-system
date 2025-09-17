/**
 * 이메일 서비스 설정
 */

export const emailConfig = {
  // SMTP 설정 (예: Gmail SMTP)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD, // App Password for Gmail
    },
    tls: {
      rejectUnauthorized: false, // Gmail에서 자주 필요
      minDHSize: 1024,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 30000, // 30초 연결 타임아웃
    socketTimeout: 30000, // 30초 소켓 타임아웃
    greetingTimeout: 30000,
    requireTLS: true,
    debug: true, // SMTP 디버그 활성화
    logger: true, // 로그 활성화
  },
  
  // 발신자 정보
  from: {
    name: process.env.EMAIL_FROM_NAME || '숙소예약 추첨 시스템',
    email: process.env.EMAIL_FROM_ADDRESS || 'noreply@company.com',
  },
  
  // 관리자 이메일
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@company.com',
    name: process.env.ADMIN_NAME || '관리자',
  },
  
  // 이메일 템플릿 설정
  templates: {
    applicationConfirm: {
      subject: '[숙소예약] 신청이 완료되었습니다',
    },
    lotteryWinner: {
      subject: '[숙소예약] 🎉 축하합니다! 당첨되셨습니다',
    },
    lotteryLoser: {
      subject: '[숙소예약] 추첨 결과 안내',
    },
  },
}
