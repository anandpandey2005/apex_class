import { env } from '../config/env.config';

export interface NotificationPayload {
  recipientEmail: string;
  recipientPhone?: string;
  studentName: string;
  type: 'LOW_ATTENDANCE' | 'FEE_REMINDER' | 'ANNOUNCEMENT_ALERT';
  message: string;
}

export class NotificationService {
  public static async sendAlert(payload: NotificationPayload): Promise<{ success: boolean; channel: string }> {
    console.log(`\n=================== 📩 ACADEMY ALERT DISPATCHER ===================`);
    console.log(`[${new Date().toISOString()}] Sending ${payload.type} to ${payload.studentName}`);
    console.log(`Email Target: ${payload.recipientEmail}`);
    if (payload.recipientPhone) console.log(`WhatsApp Target: ${payload.recipientPhone}`);
    console.log(`Institute: ${env.INSTITUTE_NAME}`);
    console.log(`Message Content:\n"${payload.message}"`);
    console.log(`===================================================================\n`);

    return {
      success: true,
      channel: payload.recipientPhone ? 'EMAIL_AND_WHATSAPP' : 'EMAIL',
    };
  }

  public static async notifyLowAttendance(
    studentName: string,
    email: string,
    phone: string | undefined,
    percentage: number
  ) {
    const message = `ALERT: ${studentName}'s attendance in recent classes has dropped to ${percentage.toFixed(
      1
    )}%, which is below the required 75% threshold. Please ensure regular attendance to avoid academic warnings.`;

    return this.sendAlert({
      recipientEmail: email,
      recipientPhone: phone,
      studentName,
      type: 'LOW_ATTENDANCE',
      message,
    });
  }

  public static async notifyFeeDue(
    studentName: string,
    email: string,
    phone: string | undefined,
    month: string,
    amountDue: number
  ) {
    const message = `FEE REMINDER: Tuition fee of ₹${amountDue} for ${month} is currently pending for ${studentName}. Kindly settle dues at your earliest convenience via the TuitionPro portal.`;

    return this.sendAlert({
      recipientEmail: email,
      recipientPhone: phone,
      studentName,
      type: 'FEE_REMINDER',
      message,
    });
  }
}
