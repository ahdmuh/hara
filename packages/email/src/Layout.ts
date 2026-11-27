export const SITE_URL = "https://projecthara.ca";
export const PORTAL_URL = "https://portal.projecthara.ca";
export const SENDER = "HARA <contact@projecthara.ca>";
export const CONTACT_EMAIL = "contact@projecthara.ca";
export const SCHULICH_URL = "https://schulich.ucalgary.ca/";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const INK = "#16161a";
const GRAPHITE = "#3b3b43";
const STEEL = "#85858f";
const PAPER = "#f2f2ef";
const BLUE = "#0a84ff";

export interface IEmail
{
    subject: string;
    html: string;
    text: string;
}

export interface IAction
{
    label: string;
    url: string;
}

export interface IContent
{
    category: string;
    title: string;
    greeting: string;
    paragraphs: string[];
    details?: { label: string; value: string }[];
    action?: IAction;
    closing?: string;
}

export function escape(value: string): string
{
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function paragraph(content: string): string
{
    return `<p style="margin:0 0 16px;font:400 16px/1.6 ${FONT};color:${GRAPHITE};">${escape(content)}</p>`;
}

function details(rows: { label: string; value: string }[]): string
{
    const cells = rows.map(row => `<tr>
<td style="padding:10px 0;border-top:1px solid #e6e6e9;font:600 13px/1.4 ${FONT};color:${STEEL};">${escape(row.label)}</td>
<td style="padding:10px 0;border-top:1px solid #e6e6e9;font:600 15px/1.4 ${FONT};color:${INK};text-align:right;">${escape(row.value)}</td>
</tr>`).join("");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-collapse:collapse;">${cells}</table>`;
}

function button(action: IAction): string
{
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr>
<td style="border-radius:999px;background:${BLUE};">
<a href="${escape(action.url)}" style="display:inline-block;padding:14px 28px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none;border-radius:999px;">${escape(action.label)}</a>
</td></tr></table>`;
}

function footer(): string
{
    return `<tr><td style="padding:0 12px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:24px;background:#050506;">
<tr><td style="padding:32px 32px 8px;"><img src="${SITE_URL}/email/hara-white.png" width="132" height="48" alt="HARA" style="display:block;border:0;outline:none;"></td></tr>
<tr><td style="padding:16px 32px 32px;font:400 13px/1.6 ${FONT};color:#9a9aa3;">
A capstone project from the Schulich School of Engineering at the
<a href="${SCHULICH_URL}" style="color:#ffffff;text-decoration:none;white-space:nowrap;"><img src="${SITE_URL}/email/ucalgary-shield-white.png" width="13" height="16" alt="" style="border:0;outline:none;vertical-align:-3px;margin-right:4px;">University of Calgary</a>.<br>
<a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;">projecthara.ca</a>
&nbsp;&middot;&nbsp;
<a href="mailto:${CONTACT_EMAIL}" style="color:#ffffff;text-decoration:none;">${CONTACT_EMAIL}</a>
</td></tr>
</table>
</td></tr>`;
}

export function subjectFor(category: string, title: string): string
{
    return `${category}: ${title}`;
}

export function render(content: IContent): IEmail
{
    const closing = content.closing ?? "If you have any questions, reply to this email and we will get back to you.";
    const body = [
        paragraph(content.greeting),
        ...content.paragraphs.map(paragraph),
        content.details ? details(content.details) : "",
        content.action ? button(content.action) : "",
        paragraph(closing),
        `<p style="margin:24px 0 0;font:400 16px/1.6 ${FONT};color:${GRAPHITE};">Thank you,<br><strong style="color:${INK};">HARA Team</strong></p>`,
    ].join("");
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(content.title)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:28px;">
<tr><td style="padding:40px 40px 8px;"><img src="${SITE_URL}/email/hara-ink.png" width="73" height="27" alt="HARA" style="display:block;border:0;outline:none;"></td></tr>
<tr><td style="padding:24px 40px 0;font:700 28px/1.2 ${FONT};letter-spacing:-0.5px;color:${INK};">${escape(content.title)}</td></tr>
<tr><td style="padding:24px 40px 36px;">${body}</td></tr>
${footer()}
</table>
</td></tr></table>
</body></html>`;
    const text = [
        content.greeting,
        ...content.paragraphs,
        ...(content.details ?? []).map(row => `${row.label}: ${row.value}`),
        content.action ? `${content.action.label}: ${content.action.url}` : "",
        closing,
        "Thank you,\nHARA Team",
        "--\nHARA, a capstone project from the Schulich School of Engineering at the University of Calgary.\nprojecthara.ca · contact@projecthara.ca",
    ].filter(Boolean).join("\n\n");
    return { subject: subjectFor(content.category, content.title), html, text };
}
