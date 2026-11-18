"use client";

import { BRAND } from "@/config/brand";
import type { CompanyInfo, InvoiceDetail } from "./types";

export type PdfLabels = {
  documentTitle: string;
  number: string;
  issuedAt: string;
  seller: string;
  billTo: string;
  document: string;
  paymentMethod: string;
  paymentLabel: string;
  amountReceived: string;
  change: string;
  code: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  notes: string;
  thanks: string;
  legalNotice: string;
  voided: string;
  voidReason: string;
  nit: string;
  phone: string;
};

type Fmt = { money: (v: number) => string; dateTime: (v: string) => string };

// Paleta del logo: navy-800, brand-600 y gray-500.
const NAVY: [number, number, number] = [0, 0, 128];
const RED: [number, number, number] = [224, 0, 0];
const GRAY: [number, number, number] = [102, 112, 133];

async function loadLogoPng(src: string, size = 256): Promise<string | null> {
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    canvas.width = size * Math.max(ratio, 1);
    canvas.height = size / Math.min(ratio, 1);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function downloadInvoicePdf(invoice: InvoiceDetail, company: CompanyInfo, L: PdfLabels, f: Fmt) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 15;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W * 0.6, 4, "F");
  doc.setFillColor(...RED);
  doc.rect(W * 0.6, 0, W * 0.4, 4, "F");

  let y = 14;
  const LOGO_W = 38;
  const LOGO_H = (LOGO_W * BRAND.fullLogoSize.height) / BRAND.fullLogoSize.width;
  const logo = await loadLogoPng(BRAND.fullLogo, 900);
  if (logo) {
    doc.addImage(logo, "PNG", M, 8, LOGO_W, LOGO_H);
  } else {
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(18);
    doc.setTextColor(...NAVY);
    doc.text("MASA", M, y + 6);
    doc.setTextColor(...RED);
    doc.text("MOTOS", M + doc.getTextWidth("MASA "), y + 6);
  }
  const infoY = logo ? 8 + LOGO_H + 5 : y + 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const companyLines = [
    company.companyName,
    company.companyTaxId ? L.nit : "",
    company.companyAddress,
    company.companyPhone ? L.phone : "",
    company.companyEmail,
  ].filter(Boolean);
  companyLines.forEach((line, i) => doc.text(line, M, infoY + i * 4));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...RED);
  doc.text(L.documentTitle.toUpperCase(), W - M, y, { align: "right" });
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text(`${L.number} ${invoice.number}`, W - M, y + 8, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`${L.issuedAt}: ${f.dateTime(invoice.issuedAt)}`, W - M, y + 15, { align: "right" });
  doc.text(`${L.seller}: ${invoice.sellerName}`, W - M, y + 20, { align: "right" });

  y = Math.max(y + 26, infoY + companyLines.length * 4);
  doc.setDrawColor(228, 231, 236);
  doc.line(M, y, W - M, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(L.billTo.toUpperCase(), M, y);
  doc.text(L.paymentMethod.toUpperCase(), W - M, y, { align: "right" });
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(invoice.customer.fullName, M, y + 6);
  doc.text(L.paymentLabel, W - M, y + 6, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  const custLines = [L.document, invoice.customer.phone, invoice.customer.email, invoice.customer.address].filter(
    Boolean,
  ) as string[];
  custLines.forEach((line, i) => doc.text(line, M, y + 11 + i * 4.5));
  if (invoice.amountReceived !== null) {
    const change = invoice.amountReceived - invoice.total;
    doc.text(`${L.amountReceived}: ${f.money(invoice.amountReceived)}`, W - M, y + 11, { align: "right" });
    if (change >= 0) doc.text(`${L.change}: ${f.money(change)}`, W - M, y + 15.5, { align: "right" });
  }
  y += 14 + custLines.length * 4.5;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [[L.code, L.description, L.quantity, L.unitPrice, L.amount]],
    body: invoice.items.map((i) => [i.code, i.name, String(i.quantity), f.money(i.unitPrice), f.money(i.lineTotal)]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, textColor: [40, 40, 40] },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 32, font: "courier", fontSize: 8 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 34 },
    },
  });

  // @ts-expect-error lastAutoTable lo agrega el plugin en tiempo de ejecución
  let ty: number = (doc.lastAutoTable?.finalY ?? y) + 8;
  const row = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 9.5);
    doc.setTextColor(...(bold ? RED : ([60, 60, 60] as [number, number, number])));
    doc.text(label, W - M - 60, ty);
    doc.text(value, W - M, ty, { align: "right" });
    ty += bold ? 8 : 5.5;
  };
  row(L.subtotal, f.money(invoice.subtotal));
  if (invoice.discount > 0) row(L.discount, `-${f.money(invoice.discount)}`);
  row(L.tax, f.money(invoice.taxAmount));
  doc.setDrawColor(...RED);
  doc.line(W - M - 60, ty - 3, W - M, ty - 3);
  ty += 2;
  row(L.total, f.money(invoice.total), true);

  let ny = ty + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const block = (text: string) => {
    const lines = doc.splitTextToSize(text, W - 2 * M);
    doc.text(lines, M, ny);
    ny += lines.length * 4 + 2;
  };
  if (invoice.notes) block(`${L.notes}: ${invoice.notes}`);
  if (invoice.status === "VOIDED" && invoice.voidReason) {
    doc.setTextColor(...RED);
    block(L.voidReason);
    doc.setTextColor(...GRAY);
  }
  if (company.invoiceFooter) block(company.invoiceFooter);

  const H = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(L.thanks, W / 2, H - 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(doc.splitTextToSize(L.legalNotice, W - 2 * M), W / 2, H - 13, { align: "center" });

  if (invoice.status === "VOIDED") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    doc.setTextColor(240, 68, 56);
    doc.text(L.voided, W / 2, H / 2, { align: "center", angle: 20 });
  }

  doc.save(`${invoice.number}.pdf`);
}
