import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads the official letter document as a high-resolution A4 PDF.
 */
export async function downloadOrderAsPdf(elementId: string, filename: string = 'Office_Order.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Letter document element #${elementId} not found`);
  }

  // Ensure any active input fields are blurred and temporary editing borders are suppressed
  const activeInput = document.activeElement as HTMLElement;
  if (activeInput && typeof activeInput.blur === 'function') {
    activeInput.blur();
  }

  // High-resolution canvas render
  const canvas = await html2canvas(element, {
    scale: 2.2, // Crisp Devanagari typography render
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    ignoreElements: (el) => {
      // Ignore UI buttons, pickers, or helper badges when rendering PDF
      return (
        el.classList.contains('print:hidden') ||
        el.classList.contains('print-hidden') ||
        el.getAttribute('data-ignore-print') === 'true'
      );
    }
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  // Multi-page handling for lengthy orders with extensive teacher tables
  while (heightLeft > 5) { // 5mm threshold to avoid blank trailing page
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(safeFilename);
}

/**
 * Prints ONLY the specified official letter document, isolating it from the rest of the webpage.
 * Uses an isolated hidden iframe for guaranteed print isolation without whole-page leakage.
 */
export function printOrderDirectly(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Letter element #${elementId} not found for printing.`);
    window.print();
    return;
  }

  // Create an isolated printing iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.id = 'print-isolation-frame';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    // Fallback to window.print() if iframe document is unavailable
    window.print();
    document.body.removeChild(iframe);
    return;
  }

  // Extract styles from current document to ensure identical rendering
  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  // Clone document element and remove editing tools / buttons
  const clone = element.cloneNode(true) as HTMLElement;
  const unwanted = clone.querySelectorAll('.print\\:hidden, .print-hidden, [data-ignore-print="true"], button, select, input[type="file"]');
  unwanted.forEach(el => el.remove());

  // Additional print specific CSS
  const printStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap');
      
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
      
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Mukta', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 13.5px;
        line-height: 1.6;
      }

      /* Bullet and list styling */
      ul, ol {
        margin: 8px 0 !important;
        padding-left: 28px !important;
      }
      ul {
        list-style-type: disc !important;
      }
      ol {
        list-style-type: decimal !important;
      }
      li {
        display: list-item !important;
        margin-bottom: 5px !important;
        line-height: 1.65 !important;
      }

      /* Table print formatting */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto !important;
      }
      tr {
        page-break-inside: avoid !important;
        page-break-after: auto !important;
      }
      thead {
        display: table-header-group !important;
      }
      th, td {
        border: 1px solid #334155 !important;
        padding: 5px 8px !important;
      }
      
      .print-hidden,
      .print\\:hidden,
      button,
      input,
      select,
      textarea {
        display: none !important;
      }
    </style>
  `;

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="hi">
      <head>
        <meta charset="utf-8">
        <title>कार्यालयीन आदेश</title>
        ${styleTags}
        ${printStyles}
      </head>
      <body>
        <div style="width: 100%; max-width: 800px; margin: 0 auto;">
          ${clone.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for resources/fonts to settle then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Error invoking iframe print:', e);
      window.print();
    } finally {
      // Remove iframe after short delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 400);
}
