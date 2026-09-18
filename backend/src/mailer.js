import nodemailer from 'nodemailer'

// Sends real email when SMTP_* settings are provided in backend/.env.
// Without them, emails are only printed to the console so development works with no setup.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, APP_URL } = process.env

const configured = Boolean(SMTP_HOST)

const transporter = configured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true })

const appUrl = (APP_URL || 'http://localhost:5173').replace(/\/$/, '')

export function inboxLink(token) {
  return `${appUrl}/#/requests/${token}`
}

// Tells a mentor they have a new intro request. The email only names the mentee and links to
// the mentor's private inbox; the message and contact details stay on that page.
// Never throws: a failed email must not fail the request itself.
export async function sendNewRequestEmail(mentor, menteeName) {
  if (!mentor.email) return

  const safeName = menteeName.replace(/[\r\n]+/g, ' ').trim()

  const message = {
    from: MAIL_FROM || 'MentHers <no-reply@menthers.local>',
    to: mentor.email,
    subject: `${safeName} would like to connect with you on MentHers`,
    text: [
      `Hi ${mentor.name},`,
      '',
      `${safeName} asked for an introduction on MentHers.`,
      'See their message and how to reach them here:',
      inboxLink(mentor.token),
      '',
      'Keep this link private. Anyone who has it can see your requests.',
    ].join('\n'),
  }

  try {
    const info = await transporter.sendMail(message)
    if (!configured) {
      console.log(`[email not configured, not sent] To: ${message.to} | ${message.subject}`)
      console.log(`  Inbox link: ${inboxLink(mentor.token)}`)
    } else {
      console.log(`Email sent to mentor ${mentor.id} (${info.messageId})`)
    }
  } catch (error) {
    console.error(`Could not email mentor ${mentor.id}:`, error.message)
  }
}
