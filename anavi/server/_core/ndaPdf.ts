import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

export type GenerateNdaPdfOptions = {
  partyAName: string;
  partyBName: string;
  jurisdiction?: string;
  templateContent: string;
};

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    const ww = font.widthOfTextAtSize(next, fontSize);
    if (ww > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generate an NDA PDF from template content.
 * Replaces {{DATE}}, {{PARTY_A_NAME}}, {{PARTY_B_NAME}}, {{JURISDICTION}}.
 */
export async function generateNdaPdf(options: GenerateNdaPdfOptions): Promise<Uint8Array> {
  const {
    partyAName,
    partyBName,
    jurisdiction = "the State of Delaware, United States",
    templateContent,
  } = options;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const margin = 50;
  const lineHeight = 14;
  const pageWidth = 596;
  const pageHeight = 842;
  const maxWidth = pageWidth - margin * 2;

  const content = templateContent
    .replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))
    .replace(/\{\{PARTY_A_NAME\}\}/g, partyAName)
    .replace(/\{\{PARTY_B_NAME\}\}/g, partyBName)
    .replace(/\{\{JURISDICTION\}\}/g, jurisdiction);

  const rawLines = content.split(/\r?\n/);
  const lines: string[] = [];
  for (const line of rawLines) {
    lines.push(...wrapText(line, maxWidth, font, fontSize));
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line || " ", {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }

  return pdfDoc.save();
}
