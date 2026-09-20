import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadOrderAsPdf(elementId: string, filename: string = 'Office_Order.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Letter document element not found');
  }

  // Create high-res canvas from the element
  const canvas = await html2canvas(element, {
    scale: 2, // 2x for sharp Hindi Devanagari typography
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 210; // A4 standard width in mm
  const pageHeight = 297; // A4 standard height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Multi-page handling if content overflows standard single A4 page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export function printOrderDirectly(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;
  window.print();
}
