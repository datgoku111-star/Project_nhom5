import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildContactNotificationEmail,
  buildContactAutoReplyEmail,
  sendEmail,
} from "@/lib/mail-sender";
import { POST } from "@/app/api/contact/route";

// Mock mail-sender and supabase
vi.mock("@/lib/mail-sender", async () => {
  const actual = await vi.importActual<any>("@/lib/mail-sender");
  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue(true),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabaseServer: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe("Contact Feature Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@hotel.com";
    process.env.SMTP_USER = "noreply@hotel.com";
  });

  describe("1. Email Template Generators", () => {
    it("should build proper notification email HTML for admin with all fields", () => {
      const html = buildContactNotificationEmail({
        name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        phone: "0912345678",
        subject: "Hỏi về đặt phòng Deluxe",
        message: "Cho mình hỏi giá phòng Deluxe vào cuối tuần này bao nhiêu?",
      });

      expect(html).toContain("Nguyễn Văn A");
      expect(html).toContain("nguyenvana@example.com");
      expect(html).toContain("0912345678");
      expect(html).toContain("Hỏi về đặt phòng Deluxe");
      expect(html).toContain("Cho mình hỏi giá phòng Deluxe vào cuối tuần này bao nhiêu?");
      expect(html).toContain("mailto:nguyenvana@example.com");
    });

    it("should handle optional fields gracefully in admin email", () => {
      const html = buildContactNotificationEmail({
        name: "Trần Thị B",
        email: "tranthib@example.com",
        message: "Tôi muốn đặt tour trải nghiệm.",
      });

      expect(html).toContain("Trần Thị B");
      expect(html).toContain("tranthib@example.com");
      expect(html).toContain("Chưa cung cấp"); // Phone fallback
      expect(html).toContain("Yêu cầu liên hệ trực tiếp từ website"); // Subject fallback
      expect(html).toContain("Tôi muốn đặt tour trải nghiệm.");
    });

    it("should build confirmation email HTML for customer", () => {
      const html = buildContactAutoReplyEmail({
        name: "Lê Văn C",
        email: "levanc@example.com",
        phone: "0987654321",
        subject: "Tư vấn dịch vụ",
        message: "Resort có dịch vụ đưa đón sân bay không?",
      });

      expect(html).toContain("Lê Văn C");
      expect(html).toContain("Tư vấn dịch vụ");
      expect(html).toContain("Resort có dịch vụ đưa đón sân bay không?");
      expect(html).toContain("000-123-456-7890"); // Hotline
    });
  });

  describe("2. Contact API Route (POST /api/contact)", () => {
    const createMockRequest = (body: any) => {
      return new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    };

    it("should return 400 when name is missing or empty", async () => {
      const req = createMockRequest({
        name: "",
        email: "customer@example.com",
        message: "Hello world",
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("họ và tên");
    });

    it("should return 400 when email is missing or empty", async () => {
      const req = createMockRequest({
        name: "Khách hàng Test",
        email: "",
        message: "Hello world",
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("địa chỉ email");
    });

    it("should return 400 when email format is invalid", async () => {
      const req = createMockRequest({
        name: "Khách hàng Test",
        email: "not-an-email",
        message: "Hello world",
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("không đúng định dạng");
    });

    it("should return 400 when message is missing or empty", async () => {
      const req = createMockRequest({
        name: "Khách hàng Test",
        email: "valid@example.com",
        message: "   ",
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("nội dung tin nhắn");
    });

    it("should process valid contact submission, send emails and return 200", async () => {
      const payload = {
        name: "Nguyễn Văn D",
        email: "nguyenvand@example.com",
        phone: "0909123456",
        subject: "Hỗ trợ đoàn du lịch",
        message: "Đoàn mình 20 người đi ngày 20/12, cần báo giá phòng.",
      };

      const req = createMockRequest(payload);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain("thành công");

      // Verify sendEmail was called for Admin notification with replyTo set to customer's email
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@hotel.com",
          replyTo: "nguyenvand@example.com",
          subject: expect.stringContaining("Nguyễn Văn D"),
        })
      );

      // Verify sendEmail was called for Customer auto-reply
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "nguyenvand@example.com",
          subject: expect.stringContaining("HSRM Resort"),
        })
      );
    });
  });
});
