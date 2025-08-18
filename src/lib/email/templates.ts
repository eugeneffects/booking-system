/**
 * 숙소별 이메일 템플릿 관리
 */

export interface AccommodationTemplate {
  id: string
  accommodationName: string
  winnerSubject: string
  winnerTemplate: string
  loserSubject: string
  loserTemplate: string
  isActive: boolean
}

// 기본 템플릿
const defaultWinnerTemplate = `
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
      <h2>{{accommodationName}} 예약에 당첨되셨습니다!</h2>
    </div>
    
    <div class="content">
      <div class="winner-badge">
        <h2 style="color: #059669; margin: 0;">🏆 {{rank}}번째 당첨자</h2>
        <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>{{employeeName}}</strong>님</p>
      </div>
      
      <p>숙소 예약 추첨에 당첨되신 것을 축하드립니다!</p>
      
      <div class="info-box">
        <h3>🏨 예약 정보</h3>
        <p><strong>숙소명:</strong> {{accommodationName}}</p>
        <p><strong>체크인:</strong> {{checkInDate}}</p>
        <p><strong>체크아웃:</strong> {{checkOutDate}}</p>
        <p><strong>당첨 순위:</strong> {{rank}}번</p>
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

const defaultLoserTemplate = `
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
      <p><strong>{{employeeName}}</strong>님, 안녕하세요.</p>
      
      <p>{{accommodationName}} 예약 추첨 결과를 안내드립니다.</p>
      
      <div class="info-box">
        <h3>📊 추첨 통계</h3>
        <p><strong>총 신청자:</strong> {{totalApplicants}}명</p>
        <p><strong>당첨자:</strong> {{winners}}명</p>
        <p><strong>경쟁률:</strong> {{competitionRate}}:1</p>
      </div>
      
      <div class="info-box">
        <h3>💡 다음 기회</h3>
        <p>아쉽게도 이번에는 당첨되지 못하셨습니다. 다음 기회에 다시 신청해주시기 바랍니다.</p>
        <ul>
          <li>다른 숙소의 예약 기간도 확인해보세요</li>
          <li>신청 기간을 놓치지 마세요</li>
          <li>궁금한 점이 있으시면 관리자에게 문의하세요</li>
        </ul>
      </div>
      
      <p>감사합니다.</p>
    </div>
    
    <div class="footer">
      <p>본 메일은 발신전용입니다. 문의사항은 관리자에게 연락주세요.</p>
    </div>
  </div>
</body>
</html>
`

// 템플릿 변수 치환 함수
export function replaceTemplateVariables(template: string, variables: Record<string, string | number>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }
  return result
}

// 기본 템플릿 가져오기
export function getDefaultWinnerTemplate(): string {
  return defaultWinnerTemplate
}

export function getDefaultLoserTemplate(): string {
  return defaultLoserTemplate
}

// 숙소별 템플릿 저장소 (실제로는 데이터베이스에 저장되어야 함)
const accommodationTemplates: Record<string, AccommodationTemplate> = {}

// 템플릿 관리 함수들
export function getAccommodationTemplate(accommodationId: string): AccommodationTemplate | null {
  return accommodationTemplates[accommodationId] || null
}

export function setAccommodationTemplate(template: AccommodationTemplate): void {
  accommodationTemplates[template.id] = template
}

export function getAllAccommodationTemplates(): AccommodationTemplate[] {
  return Object.values(accommodationTemplates)
}

export function deleteAccommodationTemplate(accommodationId: string): boolean {
  if (accommodationTemplates[accommodationId]) {
    delete accommodationTemplates[accommodationId]
    return true
  }
  return false
}
