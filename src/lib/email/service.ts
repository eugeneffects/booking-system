/**
 * 이메일 전송 서비스
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { emailConfig } from './config'

let transporter: Transporter | null = null

/**
 * 이메일 전송기 초기화
 */
function getTransporter(): Transporter {
  if (!transporter) {
    // 환경변수 확인
    if (!emailConfig.smtp.auth.user || !emailConfig.smtp.auth.pass) {
      throw new Error('이메일 SMTP 설정이 완료되지 않았습니다. SMTP_USER와 SMTP_PASSWORD 환경변수를 확인해주세요.')
    }
    
    transporter = nodemailer.createTransport(emailConfig.smtp)
  }
  return transporter
}

/**
 * 기본 이메일 전송 함수
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    // SMTP 설정 확인
    if (!emailConfig.smtp.auth.user || !emailConfig.smtp.auth.pass) {
      throw new Error('SMTP 설정이 완료되지 않았습니다. SMTP_USER와 SMTP_PASSWORD 환경변수를 확인해주세요.')
    }

    console.log('📧 이메일 전송 시작:', {
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`
    })

    const transport = getTransporter()

    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // HTML에서 태그 제거한 텍스트
    }

    const result = await transport.sendMail(mailOptions)
    console.log('✅ 이메일 전송 성공:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ 이메일 전송 실패:', error)
    throw error
  }
}

/**
 * 신청 완료 확인 이메일
 */
export async function sendApplicationConfirmEmail({
  to,
  employeeName,
  accommodationName,
  checkInDate,
  checkOutDate,
  applicationDate,
}: {
  to: string
  employeeName: string
  accommodationName: string
  checkInDate: string
  checkOutDate: string
  applicationDate: string
}) {
  const subject = emailConfig.templates.applicationConfirm.subject
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>숙소 예약 신청이 완료되었습니다</h1>
        </div>
        
        <div class="content">
          <p><strong>${employeeName}</strong>님, 안녕하세요!</p>
          
          <p>숙소 예약 신청이 성공적으로 완료되었습니다.</p>
          
          <div class="info-box">
            <h3>📋 신청 정보</h3>
            <p><strong>숙소명:</strong> ${accommodationName}</p>
            <p><strong>체크인:</strong> ${checkInDate}</p>
            <p><strong>체크아웃:</strong> ${checkOutDate}</p>
            <p><strong>신청일시:</strong> ${applicationDate}</p>
          </div>
          
          <div class="info-box">
            <h3>📅 다음 단계</h3>
            <ul>
              <li>신청 기간 마감 후 공정한 추첨이 진행됩니다</li>
              <li>추첨 결과는 이메일로 개별 안내됩니다</li>
              <li>당첨 시 상세한 예약 안내를 받으실 수 있습니다</li>
            </ul>
          </div>
          
          <p>추첨 결과를 기다려주시기 바랍니다. 감사합니다!</p>
        </div>
        
        <div class="footer">
          <p>본 메일은 발신전용입니다. 문의사항은 관리자에게 연락주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail({ to, subject, html })
}

/**
 * 당첨 알림 이메일
 */
export async function sendLotteryWinnerEmail({
  to,
  employeeName,
  accommodationName,
  checkInDate,
  checkOutDate,
  rank,
}: {
  to: string
  employeeName: string
  accommodationName: string
  checkInDate: string
  checkOutDate: string
  rank: number
}) {
  const subject = emailConfig.templates.lotteryWinner.subject
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
        .content { padding: 20px; background: #f0fdf4; }
        .winner-badge { background: #dcfce7; border: 2px solid #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 축하합니다!</h1>
          <h2>숙소 예약에 당첨되셨습니다!</h2>
        </div>
        
        <div class="content">
          <div class="winner-badge">
            <h2 style="color: #059669; margin: 0;">🏆 ${rank}번째 당첨자</h2>
            <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>${employeeName}</strong>님</p>
          </div>
          
          <p>숙소 예약 추첨에 당첨되신 것을 축하드립니다!</p>
          
          <div class="info-box">
            <h3>🏨 예약 정보</h3>
            <p><strong>숙소명:</strong> ${accommodationName}</p>
            <p><strong>체크인:</strong> ${checkInDate}</p>
            <p><strong>체크아웃:</strong> ${checkOutDate}</p>
            <p><strong>당첨 순위:</strong> ${rank}번</p>
          </div>
          
          <div class="info-box">
            <h3>📝 다음 단계</h3>
            <ol>
              <li>관리자로부터 상세한 예약 안내를 받으실 예정입니다</li>
              <li>예약 확정을 위한 추가 정보가 필요할 수 있습니다</li>
              <li>숙소 이용 규칙 및 주의사항을 확인해주세요</li>
            </ol>
          </div>
          
          <p style="color: #059669; font-weight: bold;">다시 한번 축하드리며, 즐거운 여행 되시기 바랍니다!</p>
        </div>
        
        <div class="footer">
          <p>본 메일은 발신전용입니다. 문의사항은 관리자에게 연락주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail({ to, subject, html })
}

/**
 * 미당첨 알림 이메일
 */
export async function sendLotteryLoserEmail({
  to,
  employeeName,
  accommodationName,
  totalApplicants,
  winners,
}: {
  to: string
  employeeName: string
  accommodationName: string
  totalApplicants: number
  winners: number
}) {
  const subject = emailConfig.templates.lotteryLoser.subject
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6b7280; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #6b7280; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>추첨 결과 안내</h1>
        </div>
        
        <div class="content">
          <p><strong>${employeeName}</strong>님, 안녕하세요!</p>
          
          <p>이번 숙소 예약 추첨 결과를 안내드립니다.</p>
          
          <div class="info-box">
            <h3>📊 추첨 결과</h3>
            <p><strong>숙소명:</strong> ${accommodationName}</p>
            <p><strong>전체 신청자:</strong> ${totalApplicants}명</p>
            <p><strong>당첨자 수:</strong> ${winners}명</p>
            <p><strong>경쟁률:</strong> ${(totalApplicants / winners).toFixed(1)}:1</p>
          </div>
          
          <div class="info-box">
            <p>아쉽게도 이번 추첨에서는 선정되지 않으셨습니다.</p>
            <p>높은 경쟁률로 인해 모든 분께 기회를 드리지 못해 죄송합니다.</p>
          </div>
          
          <div class="info-box">
            <h3>🔄 다음 기회</h3>
            <ul>
              <li>다음 숙소 예약 기회를 기다려주세요</li>
              <li>새로운 예약 기간이 열리면 다시 신청하실 수 있습니다</li>
              <li>지속적인 관심과 참여 부탁드립니다</li>
            </ul>
          </div>
          
          <p>다음 기회에는 좋은 결과가 있기를 바랍니다. 감사합니다!</p>
        </div>
        
        <div class="footer">
          <p>본 메일은 발신전용입니다. 문의사항은 관리자에게 연락주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail({ to, subject, html })
}

/**
 * 관리자 알림 이메일
 */
export async function sendAdminNotificationEmail({
  type,
  data,
}: {
  type: 'new_application' | 'lottery_completed'
  data: any
}) {
  const adminEmail = emailConfig.admin.email
  let subject = ''
  let html = ''
  
  switch (type) {
    case 'new_application':
      subject = '[숙소예약 관리] 새로운 신청이 등록되었습니다'
      html = `
        <h2>새로운 숙소 예약 신청</h2>
        <p><strong>신청자:</strong> ${data.employeeName} (${data.employeeNumber})</p>
        <p><strong>숙소:</strong> ${data.accommodationName}</p>
        <p><strong>기간:</strong> ${data.period}</p>
        <p><strong>신청일시:</strong> ${data.appliedAt}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/applications">관리자 페이지에서 확인하기</a></p>
      `
      break
      
    case 'lottery_completed':
      subject = '[숙소예약 관리] 추첨이 완료되었습니다'
      html = `
        <h2>추첨 완료 알림</h2>
        <p><strong>숙소:</strong> ${data.accommodationName}</p>
        <p><strong>전체 신청자:</strong> ${data.totalApplicants}명</p>
        <p><strong>당첨자:</strong> ${data.winners}명</p>
        <p><strong>추첨일시:</strong> ${data.lotteryDate}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/lottery">관리자 페이지에서 확인하기</a></p>
      `
      break
  }
  
  return await sendEmail({ 
    to: adminEmail, 
    subject, 
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${html}
      </div>
    `
  })
}

