import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * High-fidelity PDF generation utility for the Document Certificate.
 * Renders the certificate DOM node at high DPI and exports as a clean A4 PDF.
 */
export const downloadCertificateAsPdf = async (elementOrId, options = {}) => {
  const element =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!element) {
    throw new Error('Certificate element not found for PDF generation');
  }

  const filename = options.filename || 'Document_Certificate.pdf';

  // Temporarily ensure element has a clean rendering state
  const prevBoxShadow = element.style.boxShadow;
  element.style.boxShadow = 'none';

  try {
    const canvas = await html2canvas(element, {
      scale: options.scale || 3, // High DPI (300dpi equivalent)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    // Revert visual shadow
    element.style.boxShadow = prevBoxShadow;

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Standard A4 dimensions in mm: 210 x 297 (portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Canvas aspect ratio
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasRatio = canvasWidth / canvasHeight;

    // Margin in mm
    const margin = options.margin !== undefined ? options.margin : 8;
    const printableWidth = pdfWidth - margin * 2;
    const printableHeight = pdfHeight - margin * 2;

    let renderWidth = printableWidth;
    let renderHeight = renderWidth / canvasRatio;

    // If height exceeds page, scale down proportionally
    if (renderHeight > printableHeight) {
      renderHeight = printableHeight;
      renderWidth = renderHeight * canvasRatio;
    }

    // Center horizontally and vertically
    const xPos = margin + (printableWidth - renderWidth) / 2;
    const yPos = margin + (printableHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'PNG', xPos, yPos, renderWidth, renderHeight, '', 'FAST');
    pdf.save(filename);

    return true;
  } catch (error) {
    element.style.boxShadow = prevBoxShadow;
    console.error('Failed to export certificate PDF:', error);
    throw error;
  }
};

/**
 * Direct print trigger for document certificate.
 */
export const printCertificate = () => {
  window.print();
};
