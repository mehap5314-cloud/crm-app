import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { createFeedbackBatch } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const workbook = XLSX.read(bytes, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'Sheet is empty' }, { status: 400 })
    }

    const FEEDBACK_COLUMNS = [
      'Start Call', '2nd Call', '3rd call', 'New sale', 'Branch',
      'Date', 'Customer', 'Customer/Phone', 'Employee',
      'Order Lines/Product/Point of Sale Category',
      'Order Lines/Product/Name', 'Order Lines/Model',
      'Total', 'وضع المكالمه', 'وضح نسبه الحمايه', 'وضح مقاومه الخدوش',
      'الاحتفاظ بالاسكرين القديمه', 'رسوم التركيب متغيرة', 'فتره الضمان',
      'استلم الضمان', 'وضح معلومه المياه والكحول', 'تقييم الموظف',
      'مشاكل في الاسكرين', 'مشاكل مع الموظفين', 'اخري', 'ملاحظات',
      'وقت الرد علي المكالمه',
    ]

    function normalizeKey(k) { return String(k).replace(/[\s\r\n]+/g, '').trim() }

    const sheetKeys = Object.keys(jsonData[0])
    const keyMap = {}
    for (const col of FEEDBACK_COLUMNS) {
      const n = normalizeKey(col)
      const match = sheetKeys.find(sk => normalizeKey(sk) === n)
      keyMap[col] = match || ''
    }

    const rows = jsonData.map(row => {
      const mapped = {}
      for (const col of FEEDBACK_COLUMNS) {
        mapped[col] = row[keyMap[col]] || row[col] || row[col.toLowerCase()] || ''
      }
      return mapped
    })

    const result = await createFeedbackBatch(rows)

    return NextResponse.json({ success: true, count: result.count })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
