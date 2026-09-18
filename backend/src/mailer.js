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
// the mentor's account; the message and contact details stay behind sign-in.
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
        'Sign in to read their message and accept or decline:',
        accountLink(),
      ].join('\n'),
    },
    `Account link: ${accountLink()}`,
  )
}

const oneLine = (text) => text.replace(/[\r\n]+/g, ' ').trim()

export function accountLink() {
  return `${appUrl}/#/account`
}

// Tells a mentee how their intro request was answered. If it was accepted, the mentor has agreed to
// share their email address, so it is included.
export function sendRequestResponseEmail({ menteeEmail, menteeName, mentorName, mentorEmail, status }) {
  const mentor = oneLine(mentorName)

  if (status === 'accepted') {
    return deliver(
      {
        to: menteeEmail,
        subject: `${mentor} accepted your intro request on MentHers`,
        text: [
          `Hi ${oneLine(menteeName)},`,
          '',
          `Good news! ${mentor} accepted your intro request.`,
          mentorEmail ? `You can reach them at ${mentorEmail}.` : 'Sign in to see how to reach them.',
          '',
          `See all your requests: ${accountLink()}`,
        ].join('\n'),
      },
      `Accepted by ${mentor}`,
    )
  }

  return deliver(
    {
      to: menteeEmail,
      subject: `An update on your intro request to ${mentor}`,
      text: [
        `Hi ${oneLine(menteeName)},`,
        '',
        `${mentor} isn't able to take on a new mentee right now. Please don't be discouraged.`,
        'Other mentors could be a great fit. You can ask one of them for an intro:',
        `${appUrl}/#/find`,
      ].join('\n'),
    },
    `Declined by ${mentor}`,
  )
}

// Lets the site owner know that someone filed a safety report. Does nothing if ADMIN_EMAIL isn't set.
export function sendReportEmail({ reporterEmail, reportedEmail, reason, requestId }) {
  if (!process.env.ADMIN_EMAIL) return Promise.resolve(false)

  return deliver(
    {
      to: process.env.ADMIN_EMAIL,
      subject: `MentHers safety report (request #${requestId})`,
      text: [
        `Reporter: ${reporterEmail}`,
        `Reported: ${reportedEmail}`,
        `Request: #${requestId}`,
        '',
        `Reason: ${reason}`,
      ].join('\n'),
    },
    `Report about ${reportedEmail}: ${reason}`,
  )
}
