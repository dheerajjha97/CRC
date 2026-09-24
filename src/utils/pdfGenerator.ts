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

  // Create an off-screen clone with exact A4 portrait dimensions
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'temp-pdf-render-clone';
  
  // Remove interactive UI buttons, inputs, edit toolbars from clone
  const unwantedElements = clone.querySelectorAll(
    '.print\\:hidden, .print-hidden, [data-ignore-print="true"], button, select, input[type="file"], textarea, #btn-toggle-inline-edit'
  );
  unwantedElements.forEach(el => el.remove());

  // Set pristine A4 styling on clone (794px corresponds to 210mm at 96 DPI)
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minHeight = '1123px'; // A4 height at 96 DPI
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.margin = '0';
  clone.style.padding = '36px 44px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.fontFamily = "'Mukta', 'Noto Sans Devanagari', sans-serif";
  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.zIndex = '-99999';
  clone.style.visibility = 'visible';
  clone.style.opacity = '1';

  document.body.appendChild(clone);

  try {
    // Wait slightly for fonts and images to be ready
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(clone, {
      scale: 2.0, // High-DPI crisp Devanagari text
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // A4 mm
    const pageHeight = 297; // A4 mm
    const pageCanvasHeight = Math.floor((canvas.width * pageHeight) / pageWidth);
    
    // Check total height in mm
    const totalMmHeight = (canvas.height * pageWidth) / canvas.width;

    if (totalMmHeight <= pageHeight + 4) {
      // 1-Page Letter (Standard CRC Office Order)
      const imgData = canvas.toDataURL('image/png', 1.0);
      const renderHeight = Math.min(totalMmHeight, pageHeight);
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, renderHeight, undefined, 'FAST');
    } else {
      // Multi-Page Letter: Clean Page-by-Page Canvas Slicing
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height - 20) {
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

          const chunkData = pageCanvas.toDataURL('image/png', 1.0);
          const chunkMmHeight = (chunkHeight * pageWidth) / canvas.width;
          pdf.addImage(chunkData, 'PNG', 0, 0, pageWidth, chunkMmHeight, undefined, 'FAST');
        }

        renderedHeight += pageCanvasHeight;
        pageIndex++;
      }
    }

    // Clean filename
    const cleanFilename = (filename || 'Office_Order.pdf')
      .replace(/[\/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')
      .trim();
    const finalFilename = cleanFilename.endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`;

    pdf.save(finalFilename);
  } finally {
    // Clean up temporary DOM clone
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
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
