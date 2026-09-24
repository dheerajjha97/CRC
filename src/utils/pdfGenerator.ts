import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a clean, valid file system name based directly on the Letter Number / Order Number.
 * Example: 'ज्ञापांक-102/2026' -> 'ज्ञापांक-102_2026.pdf'
 */
export function getOrderPdfFilename(letterNumber?: string, fallbackPrefix: string = 'Patrank_Order'): string {
  if (!letterNumber || !letterNumber.trim()) {
    const today = new Date().toISOString().split('T')[0];
    return `${fallbackPrefix}_${today}.pdf`;
  }

  // Replace invalid OS filename characters while preserving Hindi Devnagari and numbers/letters
  const sanitized = letterNumber
    .trim()
    .replace(/[\/\\?%*:|"<>]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^[_\s-]+|[_\s-]+$/g, '');

  const result = sanitized || fallbackPrefix;
  return result.endsWith('.pdf') ? result : `${result}.pdf`;
}

/**
 * Downloads the official letter document as a high-resolution, perfectly-formatted A4 PDF.
 * File name is set to the official Letter/Order Number.
 */
export async function downloadOrderAsPdf(elementId: string, filename: string = 'Office_Order.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Letter document element #${elementId} not found`);
    throw new Error(`दस्तावेज़ नहीं मिला (#${elementId})`);
  }

  // Ensure any active input fields are blurred
  const activeInput = document.activeElement as HTMLElement;
  if (activeInput && typeof activeInput.blur === 'function') {
    activeInput.blur();
  }

  const finalFilename = getOrderPdfFilename(filename);

  try {
    // High-resolution canvas capture directly from document
    const canvas = await html2canvas(element, {
      scale: 2.0, // High-DPI crisp Devanagari text
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      ignoreElements: (el) => {
        return (
          el.classList.contains('print:hidden') ||
          el.classList.contains('print-hidden') ||
          el.getAttribute('data-ignore-print') === 'true' ||
          el.id === 'btn-toggle-inline-edit'
        );
      }
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering produced an empty image');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // A4 mm width
    const pageHeight = 297; // A4 mm height
    const totalMmHeight = (canvas.height * pageWidth) / canvas.width;

    if (totalMmHeight <= pageHeight + 5) {
      // 1-Page Letter (Standard CRC Office Order)
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const renderHeight = Math.min(totalMmHeight, pageHeight);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, renderHeight, undefined, 'FAST');
    } else {
      // Multi-Page Letter: Clean Page-by-Page Canvas Slicing
      const pageCanvasHeight = Math.floor((canvas.width * pageHeight) / pageWidth);
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height - 15) {
        if (pageIndex > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const chunkHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = chunkHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, renderedHeight, canvas.width, chunkHeight,
            0, 0, canvas.width, chunkHeight
          );

          const chunkData = pageCanvas.toDataURL('image/jpeg', 0.98);
          const chunkMmHeight = (chunkHeight * pageWidth) / canvas.width;
          pdf.addImage(chunkData, 'JPEG', 0, 0, pageWidth, chunkMmHeight, undefined, 'FAST');
        }

        renderedHeight += pageCanvasHeight;
        pageIndex++;
      }
    }

    // Trigger download via Blob URL (ensures compatibility with all browser sandboxes)
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 1500);

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
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
