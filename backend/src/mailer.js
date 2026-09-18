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
const from = MAIL_FROM || 'MentHers <no-reply@menthers.local>'

export function inboxLink(token) {
  return `${appUrl}/#/requests/${token}`
}

// Sends one email. Never throws; returns true if it was sent (or printed when email isn't
// configured) and false if sending failed. `devNote` is only printed in the unconfigured case.
async function deliver(message, devNote) {
  try {
    const info = await transporter.sendMail({ from, ...message })
    if (!configured) {
      console.log(`[email not configured, not sent] To: ${message.to} | ${message.subject}`)
      console.log(`  ${devNote}`)
    } else {
      console.log(`Email sent (${info.messageId})`)
    }
    return true
  } catch (error) {
    console.error('Could not send email:', error.message)
    return false
  }
}

// Emails the 6-digit code that proves someone owns an email address.
export function sendVerificationEmail(email, code, ttlMinutes) {
  return deliver(
    {
      to: email,
      subject: `Your MentHers verification code is ${code}`,
      text: [
        'Welcome to MentHers!',
        '',
        `Your verification code is: ${code}`,
        '',
        `It expires in ${ttlMinutes} minutes. If you didn’t ask for this, you can ignore this email.`,
      ].join('\n'),
    },
    `Verification code: ${code}`,
  )
}

// Tells a mentor they have a new intro request. The email only names the mentee and links to
// the mentor's private inbox; the message and contact details stay on that page.
export async function sendNewRequestEmail(mentor, menteeName) {
  if (!mentor.email) return false

  const safeName = menteeName.replace(/[\r\n]+/g, ' ').trim()

  return deliver(
    {
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
    },
    `Inbox link: ${inboxLink(mentor.token)}`,
  )
}
