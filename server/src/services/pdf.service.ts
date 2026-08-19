import PDFDocument from 'pdfkit';
import { env } from '../config/env.config';

export interface FeeReceiptData {
  receiptNumber: string;
  studentName: string;
  studentEmail: string;
  batchName: string;
  subject: string;
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
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header - Institute Metadata
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(env.INSTITUTE_NAME, { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text(env.INSTITUTE_ADDRESS, { align: 'center' })
        .text(`Email: ${env.INSTITUTE_EMAIL} | Phone: ${env.INSTITUTE_PHONE}`, { align: 'center' })
        .moveDown(1.5);

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#000000').moveDown(1.5);

      // Title & Receipt #
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('FEE PAYMENT RECEIPT', { align: 'left' })
        .fontSize(10)
        .font('Helvetica')
        .text(`Receipt No: ${data.receiptNumber}`, { align: 'right' })
        .text(`Date & Time: ${data.paidDate || new Date().toISOString().split('T')[0]} ${data.transactionTime || ''}`, { align: 'right' })
        .moveDown(1.5);

      // Student & Batch Info Box
      const startY = doc.y;
      doc.rect(50, startY, 500, 75).stroke('#333333');

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('STUDENT & COURSE INFORMATION', 65, startY + 12)
        .font('Helvetica')
        .fontSize(10)
        .text(`Name: ${data.studentName}`, 65, startY + 30)
        .text(`Email: ${data.studentEmail}`, 65, startY + 47)
        .text(`Batch: ${data.batchName} (${data.subject})`, 300, startY + 30)
        .text(`Billing Month: ${data.month}`, 300, startY + 47);

      doc.y = startY + 90;

      // Transaction Proof Audit Box
      const txnY = doc.y;
      doc.rect(50, txnY, 500, 65).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a');

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('TRANSACTION PROOF AUDIT RECORD', 65, txnY + 10)
        .font('Helvetica')
        .fontSize(9)
        .text(`Txn ID / UTR: ${data.transactionId || 'N/A'}`, 65, txnY + 28)
        .text(`Payment Method: ${data.paymentMethod || 'UPI'}`, 65, txnY + 44)
        .text(`Payer / Sender: ${data.senderName || data.studentName}`, 300, txnY + 28)
        .text(`Bank / Gateway: ${data.bankName || 'N/A'}`, 300, txnY + 44);

      doc.y = txnY + 80;

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Description', 65, tableTop);
      doc.text('Method', 280, tableTop);
      doc.text('Status', 380, tableTop);
      doc.text('Amount (INR)', 470, tableTop, { align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#000000');

      // Table Row
      const rowY = tableTop + 25;
      doc.font('Helvetica');
      doc.text(`Tuition Fee - ${data.month}`, 65, rowY);
      doc.text(data.paymentMethod || 'UPI', 280, rowY);
      doc.text(data.status, 380, rowY);
      doc.text(`₹${data.amountPaid.toLocaleString('en-IN')}`, 470, rowY, { align: 'right' });

      doc.moveTo(50, rowY + 20).lineTo(550, rowY + 20).stroke('#aaaaaa');

      // Total Box
      const totalY = rowY + 35;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`Total Amount Paid: ₹${data.amountPaid.toLocaleString('en-IN')}`, 300, totalY, { align: 'right' })
        .fontSize(10)
        .text(`Balance Due: ₹${(data.amountDue - data.amountPaid).toLocaleString('en-IN')}`, 300, totalY + 20, { align: 'right' });

      // Footer
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('This is a verified computer-generated receipt with digital transaction proof.', 50, 700, { align: 'center' })
        .text(`Thank you for choosing ${env.INSTITUTE_NAME}!`, 50, 715, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

