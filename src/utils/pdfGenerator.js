import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * High-fidelity PDF generation utility for Document Certificates.
 * Accommodates dynamic content length:
 * - Short documents fit seamlessly onto a single crisp A4 page.
 * - Longer letters with extended custom descriptions automatically slice
 *   naturally into multiple A4 pages without shrinking fonts or clipping content.
 */
/**
 * Core builder that produces a high-fidelity jsPDF document from a DOM element.
 * Fixes canvas clipping by setting explicit scroll offsets (scrollX: 0, scrollY: 0, x: 0, y: 0)
 * and dynamically calculates printable bounds across single or multi-page letters.
 */
export const buildCertificatePdfDoc = async (elementOrId, options = {}) => {
  const element =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!element) {
    throw new Error('Certificate element not found for PDF generation');
  }

  // Temporarily remove shadow for clean canvas capture
  const prevBoxShadow = element.style.boxShadow;
  element.style.boxShadow = 'none';

  try {
    const canvas = await html2canvas(element, {
      scale: options.scale || 2.0, // High DPI capture (crisp text & seals)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      windowWidth: Math.max(element.scrollWidth || 0, 800),
      windowHeight: Math.max(element.scrollHeight || 0, 1130)
    });

    element.style.boxShadow = prevBoxShadow;

    // Standard A4: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Standard margins (default 8mm)
    const margin = options.margin !== undefined ? options.margin : 8;
    const printableWidth = pdfWidth - margin * 2;
    const printableHeight = pdfHeight - margin * 2;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate height of one A4 page in canvas pixels
    const pageCanvasHeight = (printableHeight / printableWidth) * canvasWidth;

    // If canvas height fits roughly in one A4 page (with 5% buffer):
    if (canvasHeight <= pageCanvasHeight * 1.05) {
      const renderHeight = printableWidth * (canvasHeight / canvasWidth);
      const yPos = margin + Math.max(0, (printableHeight - renderHeight) / 2);
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', margin, yPos, printableWidth, renderHeight, '', 'FAST');
    } else {
      // Dynamic Multi-Page Slicing: preserves readable typography across multiple A4 sheets
      const totalPages = Math.ceil(canvasHeight / pageCanvasHeight);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        const sourceY = page * pageCanvasHeight;
        const sourceHeight = Math.min(pageCanvasHeight, canvasHeight - sourceY);

        // Create dedicated slice canvas for this page
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasWidth;
        sliceCanvas.height = sourceHeight;
        const ctx = sliceCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvasWidth,
          sourceHeight,
          0,
          0,
          canvasWidth,
          sourceHeight
        );

        const sliceImgData = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceRenderHeight = printableWidth * (sourceHeight / canvasWidth);

        pdf.addImage(sliceImgData, 'PNG', margin, margin, printableWidth, sliceRenderHeight, '', 'FAST');

        // Page number on multi-page letters
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          `Page ${page + 1} of ${totalPages}`,
          pdfWidth / 2,
          pdfHeight - 4,
          { align: 'center' }
        );
      }
    }

    return pdf;
  } catch (error) {
    element.style.boxShadow = prevBoxShadow;
    console.error('Failed to build certificate PDF document:', error);
    throw error;
  }
};

/**
 * Downloads the certificate directly to the client machine as a PDF file.
 */
export const downloadCertificateAsPdf = async (elementOrId, options = {}) => {
  const filename = options.filename || 'Document_Certificate.pdf';
  const pdf = await buildCertificatePdfDoc(elementOrId, options);
  pdf.save(filename);
  return true;
};

/**
 * Opens the unclipped, complete certificate PDF in a new browser tab for full preview and native printing/viewing.
 */
export const openCertificateInNewTab = async (elementOrId, options = {}) => {
  const pdf = await buildCertificatePdfDoc(elementOrId, options);
  const blobUrl = pdf.output('bloburl');
  window.open(blobUrl, '_blank');
  return true;
};

/**
 * Direct print trigger for document certificate.
 */
export const printCertificate = () => {
  window.print();
};
