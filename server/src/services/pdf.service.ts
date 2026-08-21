import PDFDocument from 'pdfkit';
import { env } from '../config/env.config';

export interface FeeReceiptData {
  receiptNumber: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  aadharNumber?: string;
  batchName: string;
  subject?: string;
  month: string;
  amountDue: number;
  amountPaid: number;
  paidDate: string;
  transactionTime?: string;
  paymentMethod: string;
  transactionId?: string;
  senderName?: string;
  bankName?: string;
  status: string;
}

export const generateFeeReceiptPDF = (data: FeeReceiptData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // 1. Header - Institute Metadata (Clean White Printable Background)
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(env.INSTITUTE_NAME || 'Apex Coaching Institute', { align: 'center' })
        .fontSize(9.5)
        .font('Helvetica')
        .fillColor('#333333')
        .text(env.INSTITUTE_ADDRESS || 'Plot 12, Knowledge Park III, Greater Noida, UP, 201310', { align: 'center' })
        .text(
          `Email: ${env.INSTITUTE_EMAIL || 'contact@apexcoaching.com'} | Phone: ${env.INSTITUTE_PHONE || '+91 8750309712'}`,
          { align: 'center' }
        )
        .moveDown(1.2);

      // 2. Divider Line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).stroke('#000000').moveDown(1.2);

      // 3. Receipt Title & Metadata
      const titleY = doc.y;
      doc
        .fontSize(15)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('FEE PAYMENT RECEIPT', 50, titleY);

      doc
        .fontSize(9.5)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`Receipt No: ${data.receiptNumber}`, 320, titleY, { align: 'right', width: 225 })
        .text(
          `Date & Time: ${data.paidDate || new Date().toISOString().split('T')[0]} ${data.transactionTime || '12:00:00'}`,
          320,
          titleY + 14,
          { align: 'right', width: 225 }
        );

      doc.y = titleY + 36;

      // 4. Student & Course Information Box (Bordered with clean padding)
      const startY = doc.y;
      const boxWidth = 495;
      const boxHeight = data.aadharNumber ? 88 : 76;
      doc.rect(50, startY, boxWidth, boxHeight).lineWidth(0.8).stroke('#333333');

      doc
        .fontSize(10.5)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('STUDENT & COURSE INFORMATION', 65, startY + 10);

      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor('#222222')
        .text(`Name: ${data.studentName}`, 65, startY + 28, { width: 220 })
        .text(`Email: ${data.studentEmail}`, 65, startY + 44, { width: 220 });

      if (data.aadharNumber) {
        doc.text(`Aadhar UID: ${data.aadharNumber}`, 65, startY + 60, { width: 220 });
      }

      const batchDisplay = `${data.batchName}${data.subject ? ' (' + data.subject + ')' : ''}`;
      doc
        .text(`Batch: ${batchDisplay}`, 290, startY + 28, { width: 245 })
        .text(`Billing Month: ${data.month}`, 290, startY + 44, { width: 245 });

      if (data.studentPhone) {
        doc.text(`Phone: ${data.studentPhone}`, 290, startY + 60, { width: 245 });
      }

      doc.y = startY + boxHeight + 14;

      // 5. Transaction Proof Audit Record Box
      const txnY = doc.y;
      const txnHeight = 62;
      doc.rect(50, txnY, boxWidth, txnHeight).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a');

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('TRANSACTION PROOF AUDIT RECORD', 65, txnY + 9);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#333333')
        .text(`Txn ID / UTR: ${data.transactionId || 'N/A'}`, 65, txnY + 26, { width: 220 })
        .text(`Payment Method: ${data.paymentMethod || 'UPI'}`, 65, txnY + 42, { width: 220 })
        .text(`Payer / Sender: ${data.senderName || data.studentName}`, 290, txnY + 26, { width: 245 })
        .text(`Bank / Gateway: ${data.bankName || 'N/A'}`, 290, txnY + 42, { width: 245 });

      doc.y = txnY + txnHeight + 16;

      // 6. Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
      doc.text('Description', 65, tableTop);
      doc.text('Method', 280, tableTop);
      doc.text('Status', 370, tableTop);
      doc.text('Amount (INR)', 430, tableTop, { align: 'right', width: 105 });

      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).lineWidth(1).stroke('#000000');

      // 7. Table Row (Formatted cleanly with Rs. instead of corrupted Unicode ₹ symbol)
      const rowY = tableTop + 24;
      doc.font('Helvetica').fontSize(9.5).fillColor('#222222');
      doc.text(`Tuition Fee - ${data.month}`, 65, rowY, { width: 200 });
      doc.text(data.paymentMethod || 'UPI', 280, rowY);
      doc.text(data.status || 'PAID', 370, rowY);
      doc.text(`Rs. ${data.amountPaid.toLocaleString('en-IN')}`, 430, rowY, { align: 'right', width: 105 });

      doc.moveTo(50, rowY + 18).lineTo(545, rowY + 18).lineWidth(0.5).stroke('#aaaaaa');

      // 8. Financial Totals Section
      const totalY = rowY + 30;
      doc
        .font('Helvetica-Bold')
        .fontSize(11.5)
        .fillColor('#000000')
        .text(`Total Amount Paid: Rs. ${data.amountPaid.toLocaleString('en-IN')}`, 250, totalY, {
          align: 'right',
          width: 295,
        })
        .fontSize(9.5)
        .font('Helvetica')
        .fillColor('#444444')
        .text(
          `Balance Due: Rs. ${Math.max(0, data.amountDue - data.amountPaid).toLocaleString('en-IN')}`,
          250,
          totalY + 18,
          { align: 'right', width: 295 }
        );

      // 9. Footer Notes (Clean printable verification message)
      doc
        .fontSize(8.5)
        .font('Helvetica-Oblique')
        .fillColor('#666666')
        .text(
          'This is a verified computer-generated receipt with digital transaction proof.',
          50,
          690,
          { align: 'center', width: 495 }
        )
        .text(
          `Thank you for choosing ${env.INSTITUTE_NAME || 'Apex Coaching Institute'}!`,
          50,
          705,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
