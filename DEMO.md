# MentHers demo guide

A 2-minute walkthrough for judges, plus what to check beforehand.

## Before you present

- [ ] The app is online and the link opens on your phone.
- [ ] Email works: sign up with your own address and check that the code arrives.
- [ ] `ANTHROPIC_API_KEY` is set, so the AI features show up (look for "Why you two might click" on matches).
- [ ] Use two email addresses you can read. With Gmail, `you+mentee@gmail.com` and `you+mentor@gmail.com` both
      arrive in the same inbox.
- [ ] Do one full practice run. Delete your test accounts afterwards from **My account > Delete my account**.
- [ ] Open the privacy and safety page once, in case judges ask about safety.

## The story (say this first, 15 seconds)

Women and girls are underrepresented in many fields, and a big reason is not having someone who has been
there. Finding a mentor is awkward: you don't know who to ask, or what to say. MentHers matches you with the
right woman and helps you make the first move.

## Demo script

1. **Landing page (10s).** "MentHers is a mentoring community for women and girls."
2. **Find a mentor (30s).** Fill in the questionnaire as a mentee. Write a real, specific goal, because the AI
   reads it. Verify with the emailed code.
3. **Matches (30s).** Point out the ranked mentors and the **"Why you two might click"** sentence. "It read my
   goal and the mentor's bio, not just checkboxes." Note the rule-based reasons underneath.
4. **Request an intro (20s).** Click **Request intro**, then **Help me write this**. "For anyone who freezes on
   the first message." Edit it and send.
5. **Mentor side (25s).** Sign out. Sign in as the mentor (emailed code, no password). Show the notification
   and the request, then **Accept**. "Accepting is the only moment the mentor's email is shared."
6. **Back to the mentee (10s).** Sign in as the mentee and show the accepted request with the mentor's contact.
7. **Close (10s).** "Reporting, account deletion and a privacy page are built in, because this is for women
   and girls."

## Questions judges may ask

**How do you keep people safe?** Email verification, a report button on every request, a mentor's email only
shared after they accept, decline at any time, and full account deletion. We are honest that we do not check
identity yet, and the next step would be verified mentors and age checks.

**How does the AI work?** Rules pick the top candidates. Claude then reads the mentee's goal and the mentors'
bios to re-rank them and explain each match, and it can draft the intro message. AI text is labelled and
editable, emails are never sent to the AI, and if it fails the app falls back to the rules.

**What did you build vs. use?** React and Vite for the frontend, Express and SQLite for the backend, Claude for
the AI features. Sign-in, verification and matching are our own code.

**What's next?** Verified mentors, age checks and guardian consent, calendar booking, group mentoring circles,
and learning from which matches turn into real conversations.

## If something goes wrong

- **No code arrives:** check spam, then use the resend link. Have a second account already signed in.
- **AI is slow or off:** the app still works. Matches show without the AI sentence.
- **Free hosting was asleep:** open the site a few minutes early so it wakes up.
