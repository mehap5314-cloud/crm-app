import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const CRM_FOLDER_ID = '1xAfqMP7DsVsms9hsU_ZgW3LxPbFQwcfP'

function getAuth() {
  const key = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_KEY_B64, 'base64').toString()
  )
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
}

export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, data } = await req.json()
    if (!name || !data) {
      return NextResponse.json({ error: 'Missing name or data' }, { status: 400 })
    }

    const buf = Buffer.from(data, 'base64')
    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    const file = await drive.files.create({
      requestBody: {
        name: `${Date.now()}_${name}`,
        mimeType: 'image/jpeg',
        parents: [CRM_FOLDER_ID],
      },
      media: { mimeType: 'image/jpeg', body: buf },
      fields: 'id, webViewLink',
    })

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { type: 'anyone', role: 'reader' },
    })

    return NextResponse.json({
      url: file.data.webViewLink,
      id: file.data.id,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
