export interface ReplyContext {
  subject: string
  from: string
  values: Record<string, string>
}

export const DEFAULT_TEXT_TEMPLATE = `Hello {{from}},

Thank you for your email. I have received your message
"{{subject}}" and will get back to you as soon as possible.

Best regards`

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function render(template: string, ctx: ReplyContext, html: boolean): string {
  return template
    .replaceAll('{{subject}}', html ? escapeHtml(ctx.subject) : ctx.subject)
    .replaceAll('{{from}}', html ? escapeHtml(ctx.from) : ctx.from)
    .replaceAll(
      /\{\{(\w+)\}\}/g,
      (whole, key: string) => html ? escapeHtml(ctx.values[key] ?? '') : (ctx.values[key] ?? whole)
    )
}

export function renderReply(
  textTemplate: string,
  htmlTemplate: string,
  ctx: ReplyContext
): { text: string; html: string } {
  return {
    text: render(textTemplate, ctx, false),
    html: render(htmlTemplate, ctx, true)
  }
}
