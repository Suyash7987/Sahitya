import { ORG, paymentMethodLabel } from "@/lib/constants";
import { itemDetailLine } from "@/lib/utils";
import type { BillRecord } from "@/types";

let logoPng: string | null | undefined;

const PAGE_MARGIN = 14;
const GREY: [number, number, number] = [220, 220, 220];
const INK: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [90, 90, 90];

function prepareLogo(bitmap: ImageBitmap) {
  const source = document.createElement("canvas");
  source.width = bitmap.width;
  source.height = bitmap.height;
  const sourceCtx = source.getContext("2d");
  if (!sourceCtx) return null;

  sourceCtx.drawImage(bitmap, 0, 0);
  const image = sourceCtx.getImageData(0, 0, source.width, source.height);
  const pixels = image.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r < 42 && g < 42 && b < 42) {
      pixels[i + 3] = 0;
    }
  }
  sourceCtx.putImageData(image, 0, 0);

  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const alpha = pixels[(y * source.width + x) * 4 + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return source.toDataURL("image/png");

  const pad = 4;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(source.width - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(source.height - cropY, maxY - minY + pad * 2);

  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;
  const croppedCtx = cropped.getContext("2d");
  if (!croppedCtx) return source.toDataURL("image/png");
  croppedCtx.fillStyle = "rgb(47, 74, 60)";
  croppedCtx.fillRect(0, 0, cropW, cropH);
  croppedCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return cropped.toDataURL("image/png");
}

async function getLogoPng() {
  if (logoPng !== undefined) return logoPng;

  try {
    const response = await fetch("/final_logo_light.webp");
    if (!response.ok) {
      logoPng = null;
      return null;
    }
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    logoPng = prepareLogo(bitmap);
    return logoPng;
  } catch {
    logoPng = null;
    return null;
  }
}

function formatInvoiceDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export async function renderInvoice(bill: BillRecord, logo: string | null) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const right = pageWidth - PAGE_MARGIN;
  const left = PAGE_MARGIN;
  let y = 12;

  // —— Header: logo + org (left) ——
  if (logo) {
    const logoHeight = 18;
    const logoWidth = logoHeight * (640 / 296);
    doc.addImage(logo, "PNG", left, y, logoWidth, logoHeight);
    y += logoHeight + 4;
  } else {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(ORG.shortName.toUpperCase(), left, y + 6);
    y += 12;
  }

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(ORG.name, left, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  for (const line of ORG.addressLines) {
    doc.text(line, left, y);
    y += 4;
  }
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.text(`Contact: ${ORG.phone}`, left, y);
  const headerBottom = y + 2;

  // —— INVOICE title + meta box (top right) ——
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(150, 150, 150);
  doc.text("INVOICE", right, 22, { align: "right" });

  const metaW = 64;
  const metaX = right - metaW;
  const metaY = 28;
  const metaRowH = 7;
  const colW = metaW / 2;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFillColor(...GREY);
  doc.rect(metaX, metaY, metaW, metaRowH, "FD");
  doc.rect(metaX, metaY + metaRowH, metaW, metaRowH, "S");
  doc.line(metaX + colW, metaY, metaX + colW, metaY + metaRowH * 2);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("INVOICE #", metaX + colW / 2, metaY + 4.6, { align: "center" });
  doc.text("DATE", metaX + colW + colW / 2, metaY + 4.6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(bill.billNumber, metaX + colW / 2, metaY + metaRowH + 4.6, {
    align: "center",
    maxWidth: colW - 2,
  });
  doc.text(formatInvoiceDate(bill.createdAt), metaX + colW + colW / 2, metaY + metaRowH + 4.6, {
    align: "center",
  });

  // —— BILL TO ——
  y = Math.max(headerBottom, metaY + metaRowH * 2) + 10;
  const billToW = 90;
  const billToHeaderH = 7;

  doc.setFillColor(...GREY);
  doc.setDrawColor(0, 0, 0);
  doc.rect(left, y, billToW, billToHeaderH, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("BILL TO", left + 3, y + 4.8);

  y += billToHeaderH + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(bill.customerName || "Walk-in", left, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  if (bill.customerPhone) {
    doc.text(`Phone: ${bill.customerPhone}`, left, y);
    y += 4;
  }
  if (bill.customerEmail) {
    doc.text(bill.customerEmail, left, y);
    y += 4;
  }
  if (bill.paymentMethod) {
    doc.text(`Payment: ${paymentMethodLabel(bill.paymentMethod)}`, left, y);
    y += 4;
  }
  doc.text(`Counter: ${bill.createdByName}`, left, y);

  const tableStartY = y + 10;
  const amountColW = 38;

  autoTable(doc, {
    startY: tableStartY,
    margin: { left, right: PAGE_MARGIN },
    head: [["DESCRIPTION", "AMOUNT"]],
    body: [
      ...bill.items.map((item) => {
        const detail = itemDetailLine(item);
        const discountNote =
          item.discountAmount > 0
            ? item.discountMode === "percent"
              ? `Discount ${item.discountValue}% (- Rs ${item.discountAmount.toFixed(2)})`
              : `Discount - Rs ${item.discountAmount.toFixed(2)}`
            : null;
        const description = [
          `${item.title}  × ${item.quantity}`,
          detail || null,
          `Rs ${item.price.toFixed(2)} each`,
          discountNote,
        ]
          .filter(Boolean)
          .join("\n");
        return [description, `Rs ${item.lineTotal.toFixed(2)}`];
      }),
      ...(bill.discountAmount > 0
        ? [
            ["Subtotal", `Rs ${bill.subtotal.toFixed(2)}`],
            [
              bill.discountMode === "percent"
                ? `Bill discount (${bill.discountValue}%)`
                : "Bill discount",
              `- Rs ${bill.discountAmount.toFixed(2)}`,
            ],
          ]
        : []),
    ],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: INK,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
      valign: "middle",
    },
    headStyles: {
      fillColor: GREY,
      textColor: INK,
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: amountColW, halign: "right", fontStyle: "bold" },
    },
  });

  const tableEndY =
    "lastAutoTable" in doc
      ? ((doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStartY)
      : tableStartY;

  // Footer row: thank-you | TOTAL | amount (template style)
  const footH = 10;
  const tableWidth = pageWidth - PAGE_MARGIN * 2;
  const totalLabelW = 28;
  const thankYouW = tableWidth - amountColW - totalLabelW;
  const footY = tableEndY;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.setFillColor(255, 255, 255);
  doc.rect(left, footY, thankYouW, footH, "FD");
  doc.setFillColor(...GREY);
  doc.rect(left + thankYouW, footY, totalLabelW, footH, "FD");
  doc.rect(left + thankYouW + totalLabelW, footY, amountColW, footH, "FD");

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Thank you for your business!", left + 3, footY + 6.4);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL", left + thankYouW + totalLabelW / 2, footY + 6.4, { align: "center" });
  doc.text(`Rs ${bill.total.toFixed(2)}`, left + thankYouW + totalLabelW + amountColW - 3, footY + 6.4, {
    align: "right",
  });

  // —— Page footer contact ——
  const footerY = pageHeight - 16;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(left, footerY - 6, right, footerY - 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `If you have any questions about this invoice, please contact ${ORG.name}, ${ORG.phone}`,
    pageWidth / 2,
    footerY,
    { align: "center", maxWidth: pageWidth - PAGE_MARGIN * 2 },
  );
  doc.setFontSize(7);
  doc.text("Generated by Sahitya POS", left, pageHeight - 8);

  return doc;
}

export async function downloadBillPdf(bill: BillRecord) {
  const logo = await getLogoPng();
  const doc = await renderInvoice(bill, logo);
  doc.save(`${bill.billNumber}.pdf`);
}
