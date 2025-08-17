/**
 * 이메일 전송 관련 Server Actions
 */

'use server'

import { 
  sendApplicationConfirmEmail, 
  sendLotteryWinnerEmail, 
  sendLotteryLoserEmail, 
  sendAdminNotificationEmail 
} from '@/lib/email/service'
import { getApplication } from './application'
import { getLotteryResults } from './lottery'
import { formatDate } from '@/lib/utils/date'

/**
 * 신청 완료 시 확인 이메일 전송 (신청자만)
 */
export async function sendApplicationConfirmationOnly(applicationId: string) {
  try {
    const application = await getApplication(applicationId)
    if (!application || !application.employee || !application.reservation_period) {
      throw new Error('신청 정보를 찾을 수 없습니다.')
    }

    const result = await sendApplicationConfirmEmail({
      to: application.employee.company_email,
      employeeName: application.employee.name,
      accommodationName: application.reservation_period.accommodations?.name || '숙소',
      checkInDate: formatDate(application.reservation_period.start_date),
      checkOutDate: formatDate(application.reservation_period.end_date),
      applicationDate: formatDate(application.applied_at, 'datetime'),
    })

    return result
  } catch (error) {
    console.error('신청 확인 이메일 전송 실패:', error)
    throw error
  }
}

/**
 * 신청 완료 시 확인 이메일 전송 (관리자 알림 포함)
 */
export async function sendApplicationConfirmation(applicationId: string) {
  try {
    const application = await getApplication(applicationId)
    if (!application || !application.employee || !application.reservation_period) {
      throw new Error('신청 정보를 찾을 수 없습니다.')
    }

    const result = await sendApplicationConfirmEmail({
      to: application.employee.company_email,
      employeeName: application.employee.name,
      accommodationName: application.reservation_period.accommodations?.name || '숙소',
      checkInDate: formatDate(application.reservation_period.start_date),
      checkOutDate: formatDate(application.reservation_period.end_date),
      applicationDate: formatDate(application.applied_at, 'datetime'),
    })

    // 관리자 알림도 전송
    await sendAdminNotificationEmail({
      type: 'new_application',
      data: {
        employeeName: application.employee.name,
        employeeNumber: application.employee.employee_number,
        accommodationName: application.reservation_period.accommodations?.name,
        period: `${formatDate(application.reservation_period.start_date)} ~ ${formatDate(application.reservation_period.end_date)}`,
        appliedAt: formatDate(application.applied_at, 'datetime'),
      }
    })

    return result
  } catch (error) {
    console.error('신청 확인 이메일 전송 실패:', error)
    throw error
  }
}

/**
 * 추첨 결과 이메일 일괄 전송 (신청자만)
 */
export async function sendLotteryResultEmailsOnly(reservationPeriodId: string) {
  try {
    const results = await getLotteryResults(reservationPeriodId)
    if (!results || results.length === 0) {
      throw new Error('추첨 결과를 찾을 수 없습니다.')
    }

    const winners = results.filter(r => r.is_winner)
    const losers = results.filter(r => !r.is_winner)
    
    // 첫 번째 결과에서 공통 정보 추출
    const firstResult = results[0]
    const accommodationName = firstResult.application?.reservation_period?.accommodations?.name || '숙소'
    const checkInDate = firstResult.application?.reservation_period?.start_date || ''
    const checkOutDate = firstResult.application?.reservation_period?.end_date || ''

    const emailResults = {
      winners: [] as any[],
      losers: [] as any[],
      errors: [] as any[]
    }

    // 당첨자 이메일 전송
    for (const winner of winners) {
      try {
        if (winner.employee?.company_email) {
          const result = await sendLotteryWinnerEmail({
            to: winner.employee.company_email,
            employeeName: winner.employee.name,
            accommodationName,
            checkInDate: formatDate(checkInDate),
            checkOutDate: formatDate(checkOutDate),
            rank: winner.rank,
          })
          emailResults.winners.push({ 
            employee: winner.employee.name, 
            email: winner.employee.company_email,
            result 
          })
        }
      } catch (error) {
        emailResults.errors.push({ 
          employee: winner.employee?.name, 
          type: 'winner', 
          error: error instanceof Error ? error.message : '알 수 없는 오류' 
        })
      }
    }

    // 미당첨자 이메일 전송
    for (const loser of losers) {
      try {
        if (loser.employee?.company_email) {
          const result = await sendLotteryLoserEmail({
            to: loser.employee.company_email,
            employeeName: loser.employee.name,
            accommodationName,
            totalApplicants: results.length,
            winners: winners.length,
          })
          emailResults.losers.push({ 
            employee: loser.employee.name, 
            email: loser.employee.company_email,
            result 
          })
        }
      } catch (error) {
        emailResults.errors.push({ 
          employee: loser.employee?.name, 
          type: 'loser', 
          error: error instanceof Error ? error.message : '알 수 없는 오류' 
        })
      }
    }

    return {
      success: true,
      summary: {
        totalResults: results.length,
        winnersNotified: emailResults.winners.length,
        losersNotified: emailResults.losers.length,
        errors: emailResults.errors.length,
      },
      details: emailResults
    }
  } catch (error) {
    console.error('추첨 결과 이메일 전송 실패:', error)
    throw error
  }
}

/**
 * 추첨 결과 이메일 일괄 전송 (관리자 알림 포함)
 */
export async function sendLotteryResultEmails(reservationPeriodId: string) {
  try {
    const results = await getLotteryResults(reservationPeriodId)
    if (!results || results.length === 0) {
      throw new Error('추첨 결과를 찾을 수 없습니다.')
    }

    const winners = results.filter(r => r.is_winner)
    const losers = results.filter(r => !r.is_winner)
    
    // 첫 번째 결과에서 공통 정보 추출
    const firstResult = results[0]
    const accommodationName = firstResult.application?.reservation_period?.accommodations?.name || '숙소'
    const checkInDate = firstResult.application?.reservation_period?.start_date || ''
    const checkOutDate = firstResult.application?.reservation_period?.end_date || ''

    const emailResults = {
      winners: [] as any[],
      losers: [] as any[],
      errors: [] as any[]
    }

    // 당첨자 이메일 전송
    for (const winner of winners) {
      try {
        if (winner.employee?.company_email) {
          const result = await sendLotteryWinnerEmail({
            to: winner.employee.company_email,
            employeeName: winner.employee.name,
            accommodationName,
            checkInDate: formatDate(checkInDate),
            checkOutDate: formatDate(checkOutDate),
            rank: winner.rank,
          })
          emailResults.winners.push({ 
            employee: winner.employee.name, 
            email: winner.employee.company_email,
            result 
          })
        }
      } catch (error) {
        emailResults.errors.push({ 
          employee: winner.employee?.name, 
          type: 'winner', 
          error: error instanceof Error ? error.message : '알 수 없는 오류' 
        })
      }
    }

    // 미당첨자 이메일 전송
    for (const loser of losers) {
      try {
        if (loser.employee?.company_email) {
          const result = await sendLotteryLoserEmail({
            to: loser.employee.company_email,
            employeeName: loser.employee.name,
            accommodationName,
            totalApplicants: results.length,
            winners: winners.length,
          })
          emailResults.losers.push({ 
            employee: loser.employee.name, 
            email: loser.employee.company_email,
            result 
          })
        }
      } catch (error) {
        emailResults.errors.push({ 
          employee: loser.employee?.name, 
          type: 'loser', 
          error: error instanceof Error ? error.message : '알 수 없는 오류' 
        })
      }
    }

    // 관리자 알림 전송
    await sendAdminNotificationEmail({
      type: 'lottery_completed',
      data: {
        accommodationName,
        totalApplicants: results.length,
        winners: winners.length,
        lotteryDate: formatDate(new Date().toISOString(), 'datetime'),
      }
    })

    return {
      success: true,
      summary: {
        totalResults: results.length,
        winnersNotified: emailResults.winners.length,
        losersNotified: emailResults.losers.length,
        errors: emailResults.errors.length,
      },
      details: emailResults
    }
  } catch (error) {
    console.error('추첨 결과 이메일 전송 실패:', error)
    throw error
  }
}

/**
 * 테스트 이메일 전송
 */
export async function sendTestEmail(to: string) {
  try {
    const { sendEmail } = await import('@/lib/email/service')
    
    const result = await sendEmail({
      to,
      subject: '[테스트] 숙소예약 시스템 이메일 테스트',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>이메일 테스트</h2>
          <p>숙소예약 추첨 시스템의 이메일 기능이 정상적으로 작동하고 있습니다.</p>
          <p><strong>전송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
          <p>이 메일을 받으셨다면 이메일 설정이 올바르게 구성되어 있습니다.</p>
        </div>
      `
    })

    return result
  } catch (error) {
    console.error('테스트 이메일 전송 실패:', error)
    throw error
  }
}
