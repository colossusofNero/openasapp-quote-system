import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SavedQuote } from '@/lib/validations/quote.schema';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

// RCG Brand Colors
const COLORS = {
  navy: { r: 30, g: 41, b: 73 },      // RGB(30, 41, 73)
  blue: { r: 74, g: 144, b: 226 },    // RGB(74, 144, 226)
  lightBlue: { r: 232, g: 243, b: 255 }, // RGB(232, 243, 255)
  success: { r: 16, g: 185, b: 129 }, // RGB(16, 185, 129)
  gray: { r: 107, g: 114, b: 128 },   // RGB(107, 114, 128)
  lightGray: { r: 243, g: 244, b: 246 }, // RGB(243, 244, 246)
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
};

/**
 * Converts RGB object to jsPDF color array
 */
function toColorArray(color: { r: number; g: number; b: number }): [number, number, number] {
  return [color.r, color.g, color.b];
}

/**
 * Draws the RCG logo on the PDF
 */
function drawLogo(doc: jsPDF, x: number, y: number) {
  // Draw building icon (simplified version)
  doc.setFillColor(...toColorArray(COLORS.navy));
  doc.rect(x, y, 8, 10, 'F');

  // Draw windows
  doc.setFillColor(255, 255, 255);
  const windowSize = 1.5;
  const windowSpacing = 2.5;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      doc.rect(
        x + 1.5 + (col * windowSpacing),
        y + 1.5 + (row * 2.5),
        windowSize,
        windowSize,
        'F'
      );
    }
  }

  // Draw text logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text('RCGV', x + 10, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(...toColorArray(COLORS.blue));
  doc.text('VALUATION', x + 10, y + 10);
}

/**
 * Generates a PDF quote matching the RCG Valuation design
 */
export function generateQuotePDF(quote: SavedQuote): void {
  // Create PDF document (Letter size: 8.5" x 11")
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // ===== HEADER: Logo and Date =====
  drawLogo(doc, margin, yPos);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('Quote Date', pageWidth - margin, yPos + 2, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text(formatDate(quote.createdAt), pageWidth - margin, yPos + 8, { align: 'right' });

  yPos += 25;

  // ===== CLIENT NAME AND ADDRESS =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...toColorArray(COLORS.blue));
  doc.text(quote.input.propertyOwnerName, margin, yPos);

  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text(quote.input.propertyAddress, margin, yPos);

  yPos += 15;

  // ===== PROPERTY DETAILS (4-COLUMN GRID) =====
  const boxWidth = (pageWidth - 2 * margin - 15) / 4; // 15mm for gaps
  const boxHeight = 18;
  const boxGap = 5;

  const propertyDetails = [
    { label: 'Purchase Price', value: formatCurrency(quote.input.purchasePrice) },
    { label: 'Building SqFt', value: formatNumber(quote.input.sqFtBuilding) },
    { label: 'Land Acres', value: quote.input.acresLand.toString() },
    { label: 'Year Built', value: quote.input.yearBuilt.toString() },
  ];

  propertyDetails.forEach((detail, index) => {
    const xPos = margin + index * (boxWidth + boxGap);

    // Draw box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(xPos, yPos, boxWidth, boxHeight, 2, 2, 'FD');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...toColorArray(COLORS.gray));
    doc.text(detail.label, xPos + boxWidth / 2, yPos + 6, { align: 'center' });

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...toColorArray(COLORS.navy));
    doc.text(detail.value, xPos + boxWidth / 2, yPos + 13, { align: 'center' });
  });

  yPos += boxHeight + 15;

  // ===== SECTION HEADER: ENGAGEMENT FEE =====
  doc.setDrawColor(...toColorArray(COLORS.gray));
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text('Engagement Fee', margin, yPos);

  yPos += 12;

  // ===== PAYMENT OPTIONS (3 BOXES) =====
  const paymentBoxWidth = (pageWidth - 2 * margin - 10) / 3; // 10mm for gaps
  const paymentBoxHeight = 45;
  const paymentGap = 5;

  // Pay Upfront (with BEST VALUE badge)
  let xPos = margin;

  // Draw BEST VALUE badge
  doc.setFillColor(...toColorArray(COLORS.success));
  doc.roundedRect(xPos + paymentBoxWidth / 2 - 18, yPos - 4, 36, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('BEST VALUE', xPos + paymentBoxWidth / 2, yPos - 0.5, { align: 'center' });

  // Draw box with blue border
  doc.setDrawColor(...toColorArray(COLORS.blue));
  doc.setLineWidth(1);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(xPos, yPos, paymentBoxWidth, paymentBoxHeight, 3, 3, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text('Pay Upfront', xPos + paymentBoxWidth / 2, yPos + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('One-time payment', xPos + paymentBoxWidth / 2, yPos + 13, { align: 'center' });

  // Price
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...toColorArray(COLORS.blue));
  doc.text(
    formatCurrency(quote.output.paymentOptions.upfront.amount),
    xPos + paymentBoxWidth / 2,
    yPos + 26,
    { align: 'center' }
  );

  // Discount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...toColorArray(COLORS.success));
  doc.text(
    `Save ${quote.output.paymentOptions.upfront.discount}%`,
    xPos + paymentBoxWidth / 2,
    yPos + 34,
    { align: 'center' }
  );

  // Pay 50/50
  xPos += paymentBoxWidth + paymentGap;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(xPos, yPos, paymentBoxWidth, paymentBoxHeight, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text('Pay 50/50', xPos + paymentBoxWidth / 2, yPos + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('2 payments', xPos + paymentBoxWidth / 2, yPos + 13, { align: 'center' });

  // First Payment
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('FIRST PAYMENT', xPos + paymentBoxWidth / 2, yPos + 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text(
    formatCurrency(quote.output.paymentOptions.fiftyFifty.firstPayment),
    xPos + paymentBoxWidth / 2,
    yPos + 25,
    { align: 'center' }
  );

  // Second Payment
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('SECOND PAYMENT', xPos + paymentBoxWidth / 2, yPos + 30, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text(
    formatCurrency(quote.output.paymentOptions.fiftyFifty.secondPayment),
    xPos + paymentBoxWidth / 2,
    yPos + 36,
    { align: 'center' }
  );

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `Total: ${formatCurrency(quote.output.paymentOptions.fiftyFifty.total)}`,
    xPos + paymentBoxWidth / 2,
    yPos + 42,
    { align: 'center' }
  );

  // Pay Over Time
  xPos += paymentBoxWidth + paymentGap;

  doc.roundedRect(xPos, yPos, paymentBoxWidth, paymentBoxHeight, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text('Pay Over Time', xPos + paymentBoxWidth / 2, yPos + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text(
    `Up to ${quote.output.paymentOptions.monthly.numberOfMonths} months`,
    xPos + paymentBoxWidth / 2,
    yPos + 13,
    { align: 'center' }
  );

  // Monthly Amount
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('PER MONTH', xPos + paymentBoxWidth / 2, yPos + 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text(
    formatCurrency(quote.output.paymentOptions.monthly.monthlyAmount),
    xPos + paymentBoxWidth / 2,
    yPos + 25,
    { align: 'center' }
  );

  // Total
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text(
    `TOTAL (${quote.output.paymentOptions.monthly.numberOfMonths} MONTHS)`,
    xPos + paymentBoxWidth / 2,
    yPos + 36,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text(
    formatCurrency(quote.output.paymentOptions.monthly.total),
    xPos + paymentBoxWidth / 2,
    yPos + 42,
    { align: 'center' }
  );

  yPos += paymentBoxHeight + 12;

  // ===== FIRST YEAR BONUS DEPRECIATION HIGHLIGHT =====
  doc.setFillColor(...toColorArray(COLORS.lightBlue));
  doc.setDrawColor(...toColorArray(COLORS.blue));
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('FIRST YEAR BONUS DEPRECIATION', margin + 5, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...toColorArray(COLORS.blue));
  doc.text(
    formatCurrency(quote.output.depreciationSummary?.year1 || 0),
    margin + 5,
    yPos + 15
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('Estimated tax benefit in Year 1', pageWidth - margin - 5, yPos + 11, {
    align: 'right',
  });

  yPos += 30;

  // ===== DEPRECIATION COMPARISON TABLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...toColorArray(COLORS.navy));
  doc.text('Depreciation Comparison', margin, yPos);

  yPos += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...toColorArray(COLORS.gray));
  doc.text('Year-by-year comparison of different depreciation methods', margin, yPos);

  yPos += 8;

  // Generate table data
  const currentYear = new Date().getFullYear();
  const summary = quote.output.depreciationSummary;
  const buildingValue = quote.output.buildingValue;
  const standardDep = buildingValue / 39;

  const tableData = [
    [
      currentYear.toString(),
      formatCurrency(summary.year1),
      formatCurrency(standardDep),
      formatCurrency(summary.year1 * 0.7),
      formatCurrency(summary.year1),
    ],
    [
      (currentYear + 1).toString(),
      formatCurrency(summary.year2),
      formatCurrency(standardDep),
      formatCurrency(summary.year2 * 0.8),
      formatCurrency(summary.year2),
    ],
    [
      (currentYear + 2).toString(),
      formatCurrency(summary.year3),
      formatCurrency(standardDep),
      formatCurrency(summary.year3 * 0.85),
      formatCurrency(summary.year3),
    ],
    [
      (currentYear + 3).toString(),
      formatCurrency(summary.year4),
      formatCurrency(standardDep),
      formatCurrency(summary.year4 * 0.9),
      formatCurrency(summary.year4),
    ],
    [
      (currentYear + 4).toString(),
      formatCurrency(summary.year5),
      formatCurrency(standardDep),
      formatCurrency(summary.year5 * 0.9),
      formatCurrency(summary.year5),
    ],
    [
      (currentYear + 5).toString(),
      formatCurrency(summary.year6),
      formatCurrency(standardDep),
      formatCurrency(summary.year6 * 0.95),
      formatCurrency(summary.year6),
    ],
  ];

  // Calculate totals
  const totalCostSeg = summary.year1 + summary.year2 + summary.year3 + summary.year4 + summary.year5 + summary.year6;
  const totalStandard = standardDep * 6;
  const totalTraditional = summary.year1 * 0.7 + summary.year2 * 0.8 + summary.year3 * 0.85 + summary.year4 * 0.9 + summary.year5 * 0.9 + summary.year6 * 0.95;

  tableData.push([
    'Total',
    formatCurrency(totalCostSeg),
    formatCurrency(totalStandard),
    formatCurrency(totalTraditional),
    formatCurrency(totalCostSeg),
  ]);

  // @ts-ignore - autoTable is added to jsPDF prototype
  autoTable(doc, {
    startY: yPos,
    head: [['Year', 'Cost Seg Est', 'Std. Dep', 'Trad. Cost Seg', 'Bonus Dep']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: toColorArray(COLORS.navy),
      textColor: toColorArray(COLORS.white),
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'right',
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'right',
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', textColor: toColorArray(COLORS.navy) },
      4: { fontStyle: 'bold', textColor: toColorArray(COLORS.blue) },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    didParseCell: function (data) {
      // Highlight first data row (current year)
      if (data.row.index === 0 && data.section === 'body') {
        data.cell.styles.fillColor = toColorArray(COLORS.lightBlue);
      }
      // Bold the totals row
      if (data.row.index === 6 && data.section === 'body') {
        data.cell.styles.fillColor = [240, 240, 240];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.lineWidth = { top: 0.5 };
        data.cell.styles.lineColor = toColorArray(COLORS.gray);
      }
      // Highlight Bonus Dep column header
      if (data.column.index === 4 && data.section === 'head') {
        data.cell.styles.fillColor = toColorArray(COLORS.blue);
      }
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore - finalY is added by autoTable
  yPos = doc.lastAutoTable.finalY + 15;

  // Check if we need a second page for footer
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = margin;
  }

  // ===== FOOTER: COMPANY INFO =====
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...toColorArray(COLORS.gray));

  const footerLines = [
    'RCG Valuation',
    'Cost Segregation Studies & Property Tax Consulting',
    'www.rcgvaluation.com | info@rcgvaluation.com',
  ];

  footerLines.forEach((line, index) => {
    doc.text(line, pageWidth / 2, yPos + (index * 5), { align: 'center' });
  });

  // Add page numbers
  // @ts-ignore - getNumberOfPages exists at runtime
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...toColorArray(COLORS.gray));
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Set PDF metadata
  doc.setProperties({
    title: `RCGV Quote - ${quote.input.propertyOwnerName}`,
    subject: 'Cost Segregation Quote',
    author: 'RCG Valuation',
    creator: 'OpenAsApp Quote System',
    keywords: 'cost segregation, depreciation, tax savings',
  });

  // Download the PDF
  const filename = `RCGV_Quote_${quote.input.propertyOwnerName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(filename);
}
