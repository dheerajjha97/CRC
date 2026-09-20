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
    <html>
      <head>
        <title>कार्यालयीन आदेश पत्र</title>
        <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Mukta', 'Noto Sans Devanagari', sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            background: #ffffff;
            font-size: 14px;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
          }
          th, td {
            border: 1px solid #334155;
            padding: 6px 10px;
            text-align: left;
          }
          th {
            background-color: #f1f5f9;
            font-weight: 600;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
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
