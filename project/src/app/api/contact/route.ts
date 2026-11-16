import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import {
  sendEmail,
  buildContactNotificationEmail,
  buildContactAutoReplyEmail,
} from "@/lib/mail-sender";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // 1. Basic validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên của bạn." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ email hợp lệ." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Địa chỉ email không đúng định dạng." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung tin nhắn." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone ? phone.trim() : "";
    const trimmedSubject = subject ? subject.trim() : "";
    const trimmedMessage = message.trim();

    // 2. Persist to customer_requests table in database (optional/safe fallback)
    try {
      await supabaseServer.from("customer_requests").insert([
        {
          name: trimmedName,
          phone: trimmedPhone || "Chưa cung cấp",
          request_details: `[Email: ${trimmedEmail}]${trimmedPhone ? ` [SĐT: ${trimmedPhone}]` : ""}${trimmedSubject ? ` [Chủ đề: ${trimmedSubject}]` : ""}\n\nNội dung liên hệ:\n${trimmedMessage}`,
          status: "PENDING",
        },
      ]);
    } catch (dbErr) {
      console.warn("Could not save contact message to Supabase database:", dbErr);
    }

    // 3. Email recipient: ADMIN_EMAIL or SMTP_USER
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    let emailSentToAdmin = false;
    let emailSentToCustomer = false;

    if (adminEmail) {
      // 3.1 Send email notification to Admin/Host
      const adminHtml = buildContactNotificationEmail({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

      emailSentToAdmin = await sendEmail({
        to: adminEmail,
        replyTo: trimmedEmail,
        subject: `[Liên hệ mới] Khách hàng ${trimmedName}${trimmedSubject ? ` - ${trimmedSubject}` : ""}`,
        html: adminHtml,
      });
    } else {
      console.warn("WARNING: ADMIN_EMAIL or SMTP_USER is not configured in env variables.");
    }

    // 3.2 Send confirmation auto-reply email to Customer
    try {
      const customerHtml = buildContactAutoReplyEmail({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

      emailSentToCustomer = await sendEmail({
        to: trimmedEmail,
        subject: `[HSRM Resort] Chúng tôi đã nhận được thông tin liên hệ của bạn`,
        html: customerHtml,
      });
    } catch (custErr) {
      console.warn("Failed to send auto-reply to customer:", custErr);
    }

    return NextResponse.json({
      success: true,
      emailSent: emailSentToAdmin,
      autoReplySent: emailSentToCustomer,
      message: "Tin nhắn của bạn đã được gửi thành công! Chúng tôi sẽ phản hồi lại qua email trong thời gian sớm nhất.",
    });
  } catch (error: any) {
    console.error("API error at /api/contact:", error);
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi máy chủ, vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
