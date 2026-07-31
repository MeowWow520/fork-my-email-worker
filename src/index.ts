import { EmailMessage } from 'cloudflare:email'
import { createMimeMessage } from 'mimetext'
import PostalMime from 'postal-mime'
import htmlTemplate from '../REPLY/REPLY_HTML.txt'
import { renderReply, DEFAULT_TEXT_TEMPLATE } from './reply'

export default {
  email: async (message, env, ctx) => {
    console.log(`Received email from ${message.from}`)

    // parse for attachments - see postal-mime for additional options
    // https://github.com/postalsys/postal-mime/tree/master?tab=readme-ov-file#postalmimeparse
    const email = await PostalMime.parse(message.raw)
    email.attachments.forEach((a) => {
      if (a.mimeType === 'application/json') {
        const jsonString =
          typeof a.content === 'string'
            ? a.content
            : new TextDecoder().decode(a.content)
        const jsonValue = JSON.parse(jsonString)
        console.log(`JSON attachment value:\n${JSON.stringify(jsonValue, null, 2)}`)
      }
    })

    // build a multipart (text + HTML) auto-reply
    // https://developers.cloudflare.com/email-routing/email-workers/reply-email-workers/
    const originalSubject = message.headers.get('subject')?.trim() ?? ''
    const subjectTemplate = env.REPLY_SUBJECT ?? 'Re: {{subject}}'
    const subject =
      originalSubject === ''
        ? 'Auto-reply'
        : subjectTemplate.replaceAll('{{subject}}', originalSubject)

    const assetBaseUrl: string = env.ASSET_BASE_URL ?? ''
    const values: Record<string, string> = {
      asset_base_url: assetBaseUrl,
      name: env.REPLY_NAME ?? '',
      username: env.REPLY_USERNAME ?? '',
      bio: env.REPLY_BIO ?? '',
      location: env.REPLY_LOCATION ?? '',
      website_url: env.REPLY_WEBSITE_URL ?? '',
      website_label: env.REPLY_WEBSITE_LABEL ?? '',
      x_url: env.REPLY_X_URL ?? '',
      x_handle: env.REPLY_X_HANDLE ?? '',
      email: env.REPLY_EMAIL ?? message.to,
      avatar_url: env.REPLY_AVATAR_URL ?? (assetBaseUrl !== '' ? `${assetBaseUrl}/avatar.jpg` : ''),
      repo_url: env.REPLY_REPO_URL ?? '',
      github_url: env.REPLY_GITHUB_URL ?? '',
      github_label: env.REPLY_GITHUB_LABEL ?? ''
    }

    const { text, html } = renderReply(env.REPLY_TEXT ?? DEFAULT_TEXT_TEMPLATE, htmlTemplate, {
      subject: originalSubject,
      from: message.from,
      values
    })

    await message.reply({
      from: {
        name: env.REPLY_FROM_NAME ?? 'Auto Reply',
        email: message.to
      },
      subject,
      text,
      html
    })
    console.log(`Replied to ${message.from} for "${subject}"`)

    ctx.waitUntil(message.forward(env.EMAIL_FORWARD_ADDRESS))
  },

  // Send email in respose to a POST request
  // TODO: CSRF protection, CORS headers, handle form data encoding
  // https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/#example-worker
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }
    const msg = createMimeMessage()
    msg.setSender(env.EMAIL_WORKER_ADDRESS)
    msg.setRecipient(env.EMAIL_FORWARD_ADDRESS)
    msg.setSubject('Worker POST')
    msg.addMessage({
      contentType: 'text/plain',
      data: (await request.text()) ?? 'No body'
    })

    var message = new EmailMessage(env.EMAIL_WORKER_ADDRESS, env.EMAIL_FORWARD_ADDRESS, msg.asRaw())
    try {
      await env.SEND_EMAIL.send(message)
    } catch (e) {
      return new Response((e as Error).message)
    }

    return new Response('OK')
  }
} satisfies ExportedHandler<Env>
