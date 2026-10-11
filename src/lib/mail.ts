import { readFile } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import sharp from "sharp";
import { ORG, paymentMethodLabel } from "@/lib/constants";
import { renderInvoice } from "@/lib/pdf";
import { formatINR } from "@/lib/utils";
import type { BillRecord } from "@/types";

const LOGO_CID = "sahitya-logo";
let logoPng: Buffer | undefined;

async function getEmailLogo() {
  if (logoPng) return logoPng;
  const file = path.join(process.cwd(), "public", "final_logo_light.webp");
  const input = await readFile(file);
  logoPng = await sharp(input)
    .flatten({ background: "#2f4a3c" })
    .png()
    .toBuffer();
  return logoPng;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendBillEmail(bill: BillRecord) {
  if (!bill.customerEmail) return { sent: false, error: "" };

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return { sent: false, error: "Email is not configured on the server." };
  }

  const payment = bill.paymentMethod ? paymentMethodLabel(bill.paymentMethod) : "";
  const address = ORG.addressLines.join(" ");
  const text = [
    `Hello ${bill.customerName},`,
    "",
    `Thank you for your purchase. Your invoice ${bill.billNumber} is attached.`,
    `Total: ${formatINR(bill.total)}`,
    payment ? `Payment: ${payment}` : "",
    "",
    "—",
    ORG.name,
    address,
    ORG.phone,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1c1612;">
<p>Hello ${escapeHtml(bill.customerName)},</p>
<p>Thank you for your purchase. Your invoice ${escapeHtml(bill.billNumber)} is attached.<br />
Total: ${escapeHtml(formatINR(bill.total))}${payment ? `<br />Payment: ${escapeHtml(payment)}` : ""}</p>
<p style="margin-top:24px;">—<br />
<strong>${escapeHtml(ORG.name)}</strong><br />
${escapeHtml(address)}<br />
${escapeHtml(ORG.phone)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#2f4a3c;border-radius:12px;">
<tr><td style="padding:12px 16px;background:#2f4a3c;">
<img src="cid:${LOGO_CID}" alt="${escapeHtml(ORG.name)}" width="220" style="display:block;width:220px;height:auto;border:0;background:#2f4a3c;" />
</td></tr>
</table>
</div>`;

  try {
    const [doc, logo] = await Promise.all([renderInvoice(bill, null), getEmailLogo()]);
    const pdf = Buffer.from(doc.output("arraybuffer"));
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: bill.customerEmail,
      subject: `Invoice ${bill.billNumber} — ${ORG.shortName}`,
      text,
      html,
      attachments: [
        {
          filename: "logo.png",
          content: logo,
          cid: LOGO_CID,
          contentDisposition: "inline",
          contentType: "image/png",
        },
        {
          filename: `${bill.billNumber}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    return { sent: true, error: "" };
  } catch (error) {
    console.error("Bill email failed:", error);
    return { sent: false, error: "The sale was saved, but the bill email could not be sent." };
  }
}
