import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import {
  sendEmail,
  buildContactNotificationEmail,
  buildContactAutoReplyEmail,
} from "@/lib/mail-sender";

export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 },
      );
    }

    const { name, email, phone, subject, message } = body as Record<
      string,
      unknown
    >;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên của bạn." },
        { status: 400 },
      );
    }

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ email hợp lệ." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Địa chỉ email không đúng định dạng." },
        { status: 400 },
      );
    }

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung tin nhắn." },
        { status: 400 },
      );
    }

    if (
      (phone !== undefined && phone !== null && typeof phone !== "string") ||
      (subject !== undefined && subject !== null && typeof subject !== "string")
    ) {
      return NextResponse.json(
        { error: "Thông tin liên hệ không hợp lệ." },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
    const trimmedMessage = message.trim();

    // 2. Save contact request to Supabase
    let savedToDatabase = false;

    try {
      const { error } = await supabaseServer.from("customer_requests").insert([
        {
          name: trimmedName,
          phone: trimmedPhone || "Chưa cung cấp",
          request_details:
            `[Email: ${trimmedEmail}]` +
            `${trimmedPhone ? ` [SĐT: ${trimmedPhone}]` : ""}` +
            `${trimmedSubject ? ` [Chủ đề: ${trimmedSubject}]` : ""}` +
            `\n\nNội dung liên hệ:\n${trimmedMessage}`,
          status: "PENDING",
        },
      ]);

      if (error) {
        console.warn("Could not save contact request:", error);
      } else {
        savedToDatabase = true;
      }
    } catch (dbErr) {
      console.warn("Supabase database error:", dbErr);
    }

    // 3. Send notification email to Admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    let emailSentToAdmin = false;
    let emailSentToCustomer = false;

    if (adminEmail) {
      try {
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
          subject: `[Liên hệ mới] Khách hàng ${trimmedName}${
            trimmedSubject ? ` - ${trimmedSubject}` : ""
          }`,
          html: adminHtml,
        });
      } catch (adminErr) {
        console.warn("Failed to send admin notification:", adminErr);
      }
    } else {
      console.warn(
        "ADMIN_EMAIL or SMTP_USER is not configured in environment variables.",
      );
    }

    // 4. Send confirmation email only if the request was received
    if (savedToDatabase || emailSentToAdmin) {
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
          subject:
            "[HSRM Resort] Chúng tôi đã nhận được thông tin liên hệ của bạn",
          html: customerHtml,
        });
      } catch (customerErr) {
        console.warn("Failed to send customer auto-reply:", customerErr);
      }
    }

    // 5. Check whether the request was successfully received
    if (!savedToDatabase && !emailSentToAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Hiện tại hệ thống chưa thể tiếp nhận tin nhắn. Vui lòng thử lại sau.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      savedToDatabase,
      emailSent: emailSentToAdmin,
      autoReplySent: emailSentToCustomer,
      message:
        "Tin nhắn của bạn đã được tiếp nhận thành công! Chúng tôi sẽ phản hồi lại qua email trong thời gian sớm nhất.",
    });
  } catch (error) {
    console.error("API error at /api/contact:", error);

    return NextResponse.json(
      {
        error: "Đã xảy ra lỗi máy chủ, vui lòng thử lại sau.",
      },
      { status: 500 },
    );
  }
}
