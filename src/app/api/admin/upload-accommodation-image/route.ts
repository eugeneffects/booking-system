import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServiceRoleClient()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const accommodationId = formData.get('accommodationId') as string | null

    if (!file || !accommodationId) {
      return NextResponse.json({ error: 'file, accommodationId는 필수입니다.' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${accommodationId}/${Date.now()}.${fileExt}`

    // 스토리지 업로드
    const { error: uploadError } = await supabase.storage
      .from('accommodations')
      .upload(fileName, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: '업로드 실패', details: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('accommodations')
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData.publicUrl

    // DB에 이미지 URL 추가
    const { error: updateError } = await supabase
      .from('accommodations')
      .update({ image_urls: supabase.rpc('array_append_distinct', { arr: 'image_urls', val: publicUrl }) })
      .eq('id', accommodationId)
      .select('image_urls')
      .single()

    // array_append_distinct 함수가 없다면 수동으로 처리
    if (updateError) {
      const { data: current } = await supabase
        .from('accommodations')
        .select('image_urls')
        .eq('id', accommodationId)
        .single()

      const currentUrls: string[] = Array.isArray(current?.image_urls) ? current!.image_urls : []
      const nextUrls = Array.from(new Set([...(currentUrls || []), publicUrl]))

      const { error: fallbackError } = await supabase
        .from('accommodations')
        .update({ image_urls: nextUrls })
        .eq('id', accommodationId)

      if (fallbackError) {
        return NextResponse.json({ error: 'DB 업데이트 실패', details: fallbackError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('업로드 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}


