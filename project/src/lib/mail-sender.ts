import nodemailer from "nodemailer";

// Retrieve SMTP credentials from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || `"HSRM Resort Booking" <noreply@hotel.com>`;

// Create transporter only if user & pass are provided
const createTransporter = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("WARNING: SMTP credentials (SMTP_USER/SMTP_PASS) are missing in environment variables. Mailer is disabled.");
    return null;
  }
  const cleanPass = SMTP_PASS.replace(/\s+/g, "");
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for others
    auth: {
      user: SMTP_USER,
      pass: cleanPass,
    },
  });
};

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/** Sends an email using SMTP transport */
export async function sendEmail({ to, subject, html, replyTo }: SendMailParams): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("Skipping sending email because mail transporter is not configured.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      replyTo: replyTo || undefined,
    });
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

/** Formats a date into a localized Vietnamese string */
export function formatVietnameseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

/** Builds a professional Vietnamese HTML email template for experience bookings */
export function buildExperienceEmailTemplate(params: {
  customerName: string;
  experienceTitle: string;
  checkInDate: string;
  checkOutDate: string;
}): string {
  const formattedCheckIn = formatVietnameseDate(params.checkInDate);
  const formattedCheckOut = formatVietnameseDate(params.checkOutDate);

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đặt dịch vụ trải nghiệm</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #1e3a8a;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 24px;
        }
        .content p {
          margin: 0 0 16px;
        }
        .highlight {
          color: #1e3a8a;
          font-weight: bold;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .schedule-table th, .schedule-table td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }
        .schedule-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        .schedule-table td {
          color: #4b5563;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Xác Nhận Đăng Ký Trải Nghiệm</h1>
        </div>
        <div class="content">
          <p>Kính chào Quý khách <span class="highlight">${params.customerName}</span>,</p>
          <p>Cảm ơn Quý khách đã đặt dịch vụ trải nghiệm <span class="highlight">${params.experienceTitle}</span> tại hệ thống Resort của chúng tôi.</p>
          <p>Chúng tôi xin gửi đến Quý khách thông tin lịch trình và thời gian chi tiết của dịch vụ như sau:</p>

          <table class="schedule-table">
            <thead>
              <tr>
                <th>Hoạt động</th>
                <th>Thời gian</th>
                <th>Chi tiết lịch trình</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600;">🏨 Check-in Khách sạn</td>
                <td><strong>14:00</strong></td>
                <td>Ngày nhận phòng: ${formattedCheckIn}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">🚌 Khởi hành Tour</td>
                <td><strong>07:30</strong></td>
                <td>Ngày tham gia: ${formattedCheckIn} (Xe đón tại sảnh Resort)</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">🎯 Tham gia Hoạt động</td>
                <td><strong>08:30 - 11:30</strong></td>
                <td>Hoạt động trải nghiệm: ${params.experienceTitle}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">🔑 Check-out Khách sạn</td>
                <td><strong>12:00</strong></td>
                <td>Ngày trả phòng: ${formattedCheckOut}</td>
              </tr>
            </tbody>
          </table>

          <p><strong>Lưu ý quan trọng:</strong> Quý khách vui lòng có mặt tại sảnh Resort trước giờ khởi hành tour 15 phút (lúc 07:15) và mang theo trang phục phù hợp để có một chuyến đi trải nghiệm trọn vẹn nhất.</p>
          <p>Nếu cần hỗ trợ thêm, Quý khách vui lòng liên hệ quầy lễ tân hoặc gọi điện tới số hotline chăm sóc khách hàng của chúng tôi.</p>
          <p>Chúc Quý khách có một kỳ nghỉ thật vui vẻ và đáng nhớ!</p>
          <br>
          <p>Trân trọng,<br><span class="highlight">Đội ngũ HSRM Resort</span></p>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống quản lý HSRM. Vui lòng không trả lời trực tiếp email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/** Builds an HTML email for admin when a customer submits the contact form */
export function buildContactNotificationEmail(params: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): string {
  const currentTime = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const subjectText = params.subject?.trim() || "Yêu cầu liên hệ trực tiếp từ website";
  const phoneText = params.phone?.trim() || "Chưa cung cấp";

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tin nhắn liên hệ mới từ khách hàng</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background-color: #f1f5f9;
          margin: 0;
          padding: 20px 10px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%);
          color: #ffffff;
          padding: 28px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 6px 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .header p {
          margin: 0;
          font-size: 13px;
          color: #e0f2fe;
          opacity: 0.95;
        }
        .badge {
          display: inline-block;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
        }
        .content {
          padding: 28px 24px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .info-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        .info-label {
          color: #64748b;
          font-weight: 600;
          width: 130px;
          background-color: #f8fafc;
        }
        .info-value {
          color: #0f172a;
          font-weight: 500;
        }
        .message-box {
          background-color: #f8fafc;
          border-left: 4px solid #0284c7;
          border-radius: 0 8px 8px 0;
          padding: 16px 20px;
          margin: 20px 0;
        }
        .message-title {
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .message-text {
          font-size: 15px;
          color: #1e293b;
          line-height: 1.7;
          white-space: pre-wrap;
          margin: 0;
        }
        .action-container {
          text-align: center;
          margin: 30px 0 10px 0;
        }
        .reply-button {
          display: inline-block;
          background-color: #0284c7;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px 24px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HSRM Resort</h1>
          <p>Hệ thống tiếp nhận thông tin liên hệ trực tiếp từ website</p>
          <span class="badge">🔔 Tin nhắn mới</span>
        </div>
        
        <div class="content">
          <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
            Quản trị viên thân mến, bạn vừa nhận được một lời nhắn liên hệ mới từ khách hàng với thông tin chi tiết như sau:
          </p>

          <table class="info-table">
            <tr>
              <td class="info-label">👤 Họ và tên:</td>
              <td class="info-value"><strong>${params.name}</strong></td>
            </tr>
            <tr>
              <td class="info-label">✉️ Email khách:</td>
              <td class="info-value">
                <a href="mailto:${params.email}" style="color: #0284c7; text-decoration: none; font-weight: 600;">
                  ${params.email}
                </a>
              </td>
            </tr>
            <tr>
              <td class="info-label">📞 Số điện thoại:</td>
              <td class="info-value">
                ${params.phone ? `<a href="tel:${params.phone}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${params.phone}</a>` : phoneText}
              </td>
            </tr>
            <tr>
              <td class="info-label">📌 Chủ đề:</td>
              <td class="info-value">${subjectText}</td>
            </tr>
            <tr>
              <td class="info-label">⏰ Thời gian gửi:</td>
              <td class="info-value">${currentTime} (Giờ Việt Nam)</td>
            </tr>
          </table>

          <div class="message-box">
            <div class="message-title">📝 Nội dung tin nhắn:</div>
            <p class="message-text">${params.message}</p>
          </div>

          <div class="action-container">
            <a href="mailto:${params.email}?subject=Re: ${encodeURIComponent(subjectText)}" class="reply-button">
              ✉️ Bấm để trả lời nhanh qua Email
            </a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px 0;">Email này được gửi tự động từ hệ thống Website HSRM Resort.</p>
          <p style="margin: 0;">Bạn có thể trả lời trực tiếp email này để gửi phản hồi tới hòm thư của khách hàng (${params.email}).</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/** Builds an HTML confirmation email for the customer */
export function buildContactAutoReplyEmail(params: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): string {
  const subjectText = params.subject?.trim() || "Yêu cầu liên hệ trực tiếp";

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HSRM Resort - Đã nhận thông tin liên hệ của bạn</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background-color: #f1f5f9;
          margin: 0;
          padding: 20px 10px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%);
          color: #ffffff;
          padding: 28px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 6px 0;
          font-size: 24px;
          font-weight: 700;
        }
        .header p {
          margin: 0;
          font-size: 13px;
          color: #e0f2fe;
        }
        .content {
          padding: 28px 24px;
        }
        .highlight {
          color: #0284c7;
          font-weight: 600;
        }
        .message-box {
          background-color: #f8fafc;
          border-left: 4px solid #0284c7;
          border-radius: 0 8px 8px 0;
          padding: 16px 20px;
          margin: 18px 0;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px 24px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HSRM Resort</h1>
          <p>Cảm ơn bạn đã liên hệ với chúng tôi</p>
        </div>

        <div class="content">
          <p style="font-size: 15px; margin: 0 0 16px;">
            Kính chào Quý khách <span class="highlight">${params.name}</span>,
          </p>
          <p style="font-size: 14px; margin: 0 0 16px; color: #334155;">
            Chúng tôi đã nhận được thông tin liên hệ của bạn liên quan đến: <strong>${subjectText}</strong>.
          </p>
          
          <div class="message-box">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">
              Nội dung bạn đã gửi:
            </p>
            <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${params.message}</p>
          </div>

          <p style="font-size: 14px; margin: 0 0 16px; color: #334155;">
            Đội ngũ tư vấn và chăm sóc khách hàng của HSRM Resort sẽ xem xét và phản hồi tới bạn trong thời gian sớm nhất qua email <strong>${params.email}</strong>${params.phone ? ` hoặc số điện thoại <strong>${params.phone}</strong>` : ""}.
          </p>
          <p style="font-size: 14px; margin: 0 0 20px; color: #334155;">
            Nếu bạn cần hỗ trợ khẩn cấp hoặc tư vấn đặt phòng ngay lập tức, xin vui lòng gọi đến số hotline: <a href="tel:0001234567890" style="color: #0284c7; font-weight: 700; text-decoration: none;">000-123-456-7890</a>.
          </p>
          <p style="margin: 20px 0 0; font-size: 14px;">
            Trân trọng cảm ơn,<br>
            <strong style="color: #1e3a8a;">Đội ngũ HSRM Resort</strong>
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px 0;">&copy; 2026 HSRM Resort. All rights reserved.</p>
          <p style="margin: 0;">Email này được gửi tự động để xác nhận đã tiếp nhận thông tin của bạn.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
