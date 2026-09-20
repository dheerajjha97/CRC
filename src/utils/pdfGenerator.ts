import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadElementAsPdf(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found for PDF export');
  }

  // Create canvas from the official letter element with high resolution
  const canvas = await html2canvas(element, {
    scale: 2, // crisp high DPI rendering
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 900
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  const imgWidth = pdfWidth - 20; // 10mm margins on left and right
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10; // top margin 10mm

  // First page
  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= (pdfHeight - 20);

  // Additional pages if order is very long with many teachers
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= (pdfHeight - 20);
  }

  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}

export function printLetterElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="hi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>कार्यालयीन आदेश पत्र - मुद्रण</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Mukta', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 10px 15px;
            color: #0f172a;
            background: #ffffff;
            font-size: 14px;
            line-height: 1.65;
            -webkit-font-smoothing: antialiased;
          }
          .official-letter-page {
            max-width: 100% !important;
            margin: 0 auto;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .flex {
            display: flex;
          }
          .items-center {
            align-items: center;
          }
          .items-start {
            align-items: flex-start;
          }
          .items-end {
            align-items: flex-end;
          }
          .justify-center {
            justify-content: center;
          }
          .justify-between {
            justify-content: space-between;
          }
          .justify-end {
            justify-content: flex-end;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .text-left {
            text-align: left;
          }
          .text-justify {
            text-align: justify;
            text-justify: inter-word;
          }
          .font-bold {
            font-weight: 700;
          }
          .font-semibold {
            font-weight: 600;
          }
          .font-medium {
            font-weight: 500;
          }
          .underline {
            text-decoration: underline;
          }
          .w-full {
            width: 100%;
          }
          .border {
            border: 1px solid #cbd5e1;
          }
          .border-b {
            border-bottom: 1px solid #cbd5e1;
          }
          .border-b-2 {
            border-bottom: 2px solid #0f172a;
          }
          .border-t {
            border-top: 1px solid #cbd5e1;
          }
          .rounded {
            border-radius: 4px;
          }
          .rounded-lg {
            border-radius: 8px;
          }
          .rounded-full {
            border-radius: 9999px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #334155;
            padding: 6px 9px;
            text-align: left;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #020617;
            font-weight: 700;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .primary-signatory-block, .endorsement-copy-to-block, .meeting-details-box {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }
          @media print {
            body { 
              padding: 0; 
              margin: 0; 
            }
            .official-letter-page {
              padding: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML || element.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}
