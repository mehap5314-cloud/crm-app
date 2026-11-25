import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { MIRROR_COLUMNS } from '@/lib/sheetSync'
import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Download every complaint as a real Excel (.xlsx) file — works offline,
// no Google account/permissions needed.
export async function GET() {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = getDb().prepare('SELECT * FROM issues ORDER BY id ASC').all()

    const data = rows.map((row) => {
      const v = (x) => (x === null || x === undefined ? '' : x)
      return {
        'CRM ID': v(row.id),
        'Ticket': v(row.ticket),
        'Start Call': v(row.start_call),
        '2nd Call': v(row.second_call),
        'Closing Date': v(row.closing_date),
        'Branch': v(row.branch),
        'Complaints Destination': v(row.destination),
        'Mobile Type': v(row.mobile_type),
        'Sold By': v(row.sold_by),
        'Customer Name': v(row.customer_name),
        'Contact Number': v(row.contact_number),
        'Description': v(row.description),
        'Final Conclusion': v(row.final_conclusion),
        'Status': v(row.status),
        'Handled by': v(row.handled_by),
        'Issue code': v(row.issue_code),
        'Exception': v(row.exception),
        'Amount Refund': v(row.amount_refund),
        'Refund Reason': v(row.refund_reason),
        'Follow up': v(row.follow_up),
        'Note': v(row.note),
        'Created By': v(row.created_by),
        'Created At': row.created_at ? String(row.created_at).replace('T', ' ').split('.')[0] : '',
        'Updated By': v(row.updated_by),
        'Updated At': row.updated_at ? String(row.updated_at).replace('T', ' ').split('.')[0] : '',
        'Deleted': row.deleted ? 'Yes' : '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(data, { header: MIRROR_COLUMNS })
    ws['!cols'] = MIRROR_COLUMNS.map((c) => ({ wch: Math.min(Math.max(c.length + 2, 12), 40) }))
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length, c: MIRROR_COLUMNS.length - 1 } }) }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Complaints')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const today = new Date().toISOString().split('T')[0]

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="CRM-Complaints-${today}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
