"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/routers/types";
import ButtonPrimary from "@/shared/ButtonPrimary";
import type { InvoiceData } from "@/types/hotel";
import { Dialog, Transition } from "@headlessui/react";
import ButtonSecondary from "@/shared/ButtonSecondary";
import { Printer, CreditCard, XCircle, Compass } from "lucide-react";

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"CARD" | "CASH" | "BANK_TRANSFER">("CARD");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isRequestingCheckout, setIsRequestingCheckout] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/hsrm-login?callbackUrl=/bookings/${params.id}` as Route);
    } else if (user) {
      fetchInvoice();
    }
  }, [user, isLoading, router, params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/bookings/${params.id}/invoice`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const data = await res.json();
      setInvoice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!invoice) return;
    setCheckoutLoading(true);
    setError("");
    
    try {
      const res = await fetch(`/api/checkin/${params.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: selectedPaymentMethod,
          amount: invoice.balance_due,
          transaction_ref: "TXN-" + Math.random().toString(36).substring(7).toUpperCase()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout failed");
      }

      setSuccess("Checkout completed successfully! Thank you for staying with us.");
      fetchInvoice(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (isStaff && !cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy phòng.");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.ok) {
        setCancelModalOpen(false);
        setSuccess("Đã hủy đặt phòng thành công.");
        fetchInvoice(); // Refresh data
      } else {
        const err = await res.json();
        setError(err.error || "Failed to cancel booking.");
      }
    } catch (err: any) {
      console.error("Cancel error:", err);
      setError("An error occurred while cancelling the booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmBooking = async () => {
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setSuccess("Đã xác nhận phòng thành công.");
        fetchInvoice(); // Refresh data
      } else {
        const err = await res.json();
        setError(err.error || "Failed to confirm booking.");
      }
    } catch (err: any) {
      console.error("Confirm error:", err);
      setError("An error occurred while confirming.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRequestCheckout = async () => {
    setIsRequestingCheckout(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/request-checkout`, {
        method: "POST",
      });
      if (res.ok) {
        setSuccess("Đã gửi yêu cầu trả phòng (checkout) đến Lễ tân.");
        fetchInvoice(); // Refresh data
      } else {
        const err = await res.json();
        setError(err.error || "Failed to request checkout.");
      }
    } catch (err: any) {
      console.error("Request checkout error:", err);
      setError("An error occurred while requesting checkout.");
    } finally {
      setIsRequestingCheckout(false);
    }
  };

  if (isLoading || loading) return <div className="container py-20">Loading...</div>;
  if (!invoice) return <div className="container py-20">Invoice not found or error occurred.</div>;

  const b = invoice.booking;
  const isStaff = ["ADMIN", "RECEPTIONIST"].includes(user?.role || "");
  const canCheckout = isStaff && b.status === "CHECKED_IN";
  const canConfirm = isStaff && b.status === "PENDING";
  const canCancel = (b.status === "PENDING" || (!isStaff && b.status === "CONFIRMED"));
  
  let isExp = false;
  let expMeta: any = null;
  if (b.special_requests) {
    try {
      const parsed = JSON.parse(b.special_requests);
      if (parsed && parsed.isExperience) {
        isExp = true;
        expMeta = parsed;
      }
    } catch (e) {}
  }
  
  const canRequestCheckout = !isStaff && b.status === "CHECKED_IN" && (!b.checkout_step || b.checkout_step === "NONE");
  
  let cancelReasonText = null;
  if (b.special_requests) {
    const match = b.special_requests.match(/\[CANCEL_REASON:\s*(.*?)\]/);
    if (match && match[1]) {
      cancelReasonText = match[1];
    }
  }

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center gap-3">
          <h2 className="text-3xl font-semibold sm:text-4xl">Booking Details</h2>
          <div className="flex gap-3">
            {canConfirm && (
              <button 
                onClick={handleConfirmBooking}
                disabled={isConfirming}
                className="flex items-center text-white font-medium bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isConfirming ? "Confirming..." : "Confirm Booking"}
              </button>
            )}
            {canCancel && (
              <button 
                onClick={() => setCancelModalOpen(true)}
                className="flex items-center text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 mr-2" /> Cancel Booking
              </button>
            )}
            {canRequestCheckout && (
              <button 
                onClick={handleRequestCheckout}
                disabled={isRequestingCheckout}
                className="flex items-center text-white font-medium bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRequestingCheckout ? "Sending..." : "Request Checkout"}
              </button>
            )}
            <button className="flex items-center text-primary-6000 hover:text-primary-700 font-medium bg-primary-50 px-4 py-2 rounded-lg" onClick={() => window.print()}>
              <Printer className="w-5 h-5 mr-2" /> Print Invoice
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl">{error}</div>}
        {success && <div className="p-4 bg-green-100 text-green-800 rounded-xl">{success}</div>}

        {!isStaff && b.checkout_step && b.checkout_step !== "NONE" && (
          <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2">Checkout Request Status:</h3>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                b.checkout_step === "REQUESTED" ? "bg-amber-200 text-amber-900" :
                b.checkout_step === "INSPECTING" ? "bg-blue-200 text-blue-900" :
                "bg-green-200 text-green-900"
              }`}>
                {b.checkout_step === "REQUESTED" ? "Waiting for Receptionist" :
                 b.checkout_step === "INSPECTING" ? "Inspecting Room" :
                 "Inspection Complete"}
              </span>
            </div>
            {b.checkout_message && (
              <p className="text-sm text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg mt-3">
                <span className="font-bold">Receptionist:</span> {b.checkout_message}
              </p>
            )}
            {b.checkout_step === "INSPECTED" && (
              <p className="text-sm font-medium mt-3 text-green-700 dark:text-green-400">
                Room inspection is complete. Please go to the reception desk to finalize your payment.
              </p>
            )}
          </div>
        )}

        {/* Invoice Paper */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-3xl shadow-lg p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
          
          <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-700 pb-8 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-primary-6000 mb-1">HotelOS</h1>
              <p className="text-neutral-500 text-sm">123 Hospitality Ave, Tech City</p>
              <p className="text-neutral-500 text-sm">contact@hotelos.com</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold mb-1">INVOICE</h3>
              <p className="text-neutral-500 text-sm">#INV-{b.id.split('-')[0].toUpperCase()}</p>
              <p className="text-neutral-500 text-sm">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
                {isExp ? "Thông tin người đặt (Billed To):" : "Billed To:"}
              </h4>
              <p className="font-medium">{b.guest?.full_name || b.user?.full_name}</p>
              <p className="text-neutral-500 text-sm">{b.guest?.email || b.user?.email}</p>
              {(b.guest?.phone || b.user?.phone) && <p className="text-neutral-500 text-sm">{b.guest?.phone || b.user?.phone}</p>}
              {b.guest?.nationality && <p className="text-neutral-500 text-sm">Quốc tịch: {b.guest.nationality}</p>}
            </div>
            <div className="text-right">
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
                {isExp ? "Thông tin phòng & Trải nghiệm:" : "Stay Details:"}
              </h4>
              {isExp ? (
                <>
                  <p className="font-medium text-emerald-600">🧗 {expMeta?.title || "Dịch vụ Trải nghiệm"}</p>
                  <p className="text-neutral-500 text-sm">Loại: {expMeta?.category || "Tours"}</p>
                  <p className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold mt-1">
                    🚪 Phòng đang ở: Room {b.room?.room_number || "Đang xác nhận"} ({b.room?.room_type?.name || "Stay"})
                  </p>
                </>
              ) : (
                <p className="font-medium">Room {b.room?.room_number} ({b.room?.room_type?.name})</p>
              )}
              <p className="text-neutral-500 text-sm mt-1">{b.check_in_date} — {b.check_out_date}</p>
              <p className="text-neutral-500 text-sm">Status: <span className="font-semibold">{b.status}</span></p>
              {b.status === "CANCELLED" && cancelReasonText && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 font-medium italic break-words">
                    Lý do hủy: {cancelReasonText}
                  </p>
                )}
            </div>
          </div>

          <table className="w-full text-left mb-8">
            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {/* Room Charge */}
              <tr>
                <td className="py-4 px-4">
                  <div className="font-medium">Room Charge</div>
                  <div className="text-sm text-neutral-500">{b.room?.room_type?.base_price} VND x {Math.ceil((new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) / (1000*60*60*24))} nights</div>
                </td>
                <td className="py-4 px-4 text-right font-medium">{formatMoney(invoice.room_charges)}</td>
              </tr>
              
              {/* Services */}
              {invoice.service_charges.map((order, i) => (
                <React.Fragment key={i}>
                  {order.items.map((item, j) => (
                    <tr key={`${i}-${j}`}>
                      <td className="py-4 px-4">
                        <div className="font-medium">{item.service?.name}</div>
                        <div className="text-sm text-neutral-500">{item.quantity} x {formatMoney(item.unit_price)}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">{formatMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Incident Charges */}
              {invoice.incident_charges && invoice.incident_charges.incidents.length > 0 && (
                <React.Fragment>
                  {invoice.incident_charges.incidents.map((incident, i) => (
                    <tr key={`incident-${i}`} className="text-red-600 dark:text-red-400">
                      <td className="py-4 px-4">
                        <div className="font-medium">Sự cố / Phạt đền: {incident.description}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Mã: {incident.incident_code} | Trạng thái: {incident.status}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatMoney(Number(incident.approved_charge || incident.estimated_charge || 0))}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )}

              {/* Auxiliary Charges: Experiences */}
              {invoice.experience_charges && invoice.experience_charges.map((exp, i) => (
                <tr key={`exp-${i}`} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-4 px-4">
                    <div className="font-medium">Experience / Tour Booking</div>
                    <div className="text-sm text-neutral-500">{exp.guests} Guests</div>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">{formatMoney(exp.total)}</td>
                </tr>
              ))}

              {/* Auxiliary Charges: Cars */}
              {invoice.car_charges && invoice.car_charges.map((car, i) => (
                <tr key={`car-${i}`} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-4 px-4">
                    <div className="font-medium">Car Rental</div>
                    <div className="text-sm text-neutral-500">{car.car_type}</div>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">{formatMoney(car.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Experience Itinerary Section */}
          {isExp && (() => {
            const titleLower = (expMeta?.title || "").toLowerCase();
            let tourKey = "";
            if (titleLower.includes("climbing") || titleLower.includes("leo núi") || titleLower.includes("hike") || titleLower.includes("hiking")) tourKey = "climbing";
            else if (titleLower.includes("rowing") || titleLower.includes("chèo thuyền") || titleLower.includes("boat") || titleLower.includes("tour") || titleLower.includes("tràng an")) tourKey = "rowing";
            else if (titleLower.includes("swimming") || titleLower.includes("bơi") || titleLower.includes("tắm biển") || titleLower.includes("surf") || titleLower.includes("surfing")) tourKey = "swimming";
            else if (titleLower.includes("skiing") || titleLower.includes("trượt tuyết")) tourKey = "skiing";

            const itineraries: Record<string, { gatheringTime: string, gatheringLocation: string, timeline: { time: string, title: string, desc: string }[] }> = {
              climbing: {
                gatheringTime: "07:00 AM",
                gatheringLocation: "Cổng số 1, Vườn Quốc Gia Hoàng Liên Sơn (Sapa, Lào Cai)",
                timeline: [
                  { time: "07:00 - 07:30", title: "Tập trung & Khởi động", desc: "Gặp gỡ hướng dẫn viên chuyên nghiệp, kiểm tra trang bị an toàn cá nhân và khởi động làm nóng cơ thể." },
                  { time: "07:30 - 11:30", title: "Chinh phục Chặng 1", desc: "Bắt đầu leo qua các dốc đá thoai thoải, xuyên qua khu rừng trúc nguyên sinh và vượt suối nhỏ." },
                  { time: "11:30 - 12:30", title: "Nghỉ trưa tại Trạm dừng 2000m", desc: "Dùng bữa trưa dinh dưỡng với cơm lam bản địa, ngắm nhìn thung lũng Mường Hoa tuyệt đẹp từ trên cao." },
                  { time: "12:30 - 15:30", title: "Bứt tốc lên đỉnh núi", desc: "Chinh phục các đoạn dốc đứng đá tai mèo đầy thử thách, hỗ trợ nhau bằng gậy leo núi và dây đai hỗ trợ." },
                  { time: "15:30 - 16:30", title: "Chạm đỉnh Fansipan & Xuống núi", desc: "Chụp ảnh check-in đỉnh núi, nhận huy chương kỷ niệm chặng leo và chuẩn bị di chuyển xuống chân núi bằng hệ thống cáp treo hiện đại." }
                ]
              },
              rowing: {
                gatheringTime: "08:30 AM",
                gatheringLocation: "Bến thuyền du lịch sinh thái Tràng An (Ninh Bình)",
                timeline: [
                  { time: "08:30 - 09:00", title: "Chuẩn bị xuất bến", desc: "Nghe hướng dẫn kỹ thuật chèo xuồng Kayak cơ bản và quy tắc an toàn sông nước, mặc áo phao cứu hộ." },
                  { time: "09:00 - 11:30", title: "Khám phá danh thắng Tràng An", desc: "Tự tay chèo thuyền xuôi dòng sào khê, luồn lách qua các hang động đá vôi tự nhiên thạch nhũ huyền ảo." },
                  { time: "11:30 - 12:30", title: "Ghé thăm Đền cổ ven sông", desc: "Neo thuyền nghỉ ngơi, tham quan đền Trần cổ kính linh thiêng nằm cô độc giữa lòng núi đá vôi." },
                  { time: "12:30 - 13:30", title: "Chèo ngược dòng & Cập bến", desc: "Chèo thong thả ngắm hoàng hôn đổ bóng trên dãy núi đá vôi, cập bến an toàn và bàn giao lại trang thiết bị chèo." }
                ]
              },
              swimming: {
                gatheringTime: "09:00 AM",
                gatheringLocation: "Quầy lễ tân bể bơi vô cực Fis Hotel (Tầng 5 tòa nhà chính)",
                timeline: [
                  { time: "09:00 - 09:15", title: "Nhận đồ & Check-in", desc: "Khách hàng xuất trình mã QR xác nhận dịch vụ tại quầy, nhận tủ đồ khóa từ thông minh và bộ khăn tắm." },
                  { time: "09:15 - 10:30", title: "Trải nghiệm bơi vô cực ngắm thành phố", desc: "Tự do bơi lội trong làn nước mát lành, ngắm trọn vẹn view đường chân trời Hà Nội từ bể bơi vô cực trên cao." },
                  { time: "10:30 - 11:30", title: "Thư giãn Sauna & Bể sục Jacuzzi", desc: "Tận hưởng phòng xông hơi đá muối thải độc và ngâm mình thư giãn trong dòng nước sủi bọt ấm Jacuzzi giúp hồi phục cơ bắp." }
                ]
              },
              skiing: {
                gatheringTime: "08:00 AM",
                gatheringLocation: "Trạm dịch vụ thiết bị trượt tuyết Zone A (Chân núi tuyết)",
                timeline: [
                  { time: "08:00 - 09:00", title: "Nhận trang bị trượt tuyết", desc: "Nhận ủng, ván trượt, gậy và mũ bảo hiểm. Nghe hướng dẫn an toàn tuyết cơ bản." },
                  { time: "09:00 - 12:00", title: "Trượt tuyết chặng sơ cấp & trung cấp", desc: "Luyện tập kỹ thuật phanh, rẽ trên dốc thoai thoải dưới sự giám sát của huấn luyện viên." },
                  { time: "12:00 - 14:00", title: "Nghỉ ngơi & Trải nghiệm nâng cao", desc: "Dùng đồ uống nóng tại cabin gỗ và thử thách các đường trượt dốc cao hơn." }
                ]
              },
              default: {
                gatheringTime: "08:00 AM",
                gatheringLocation: "Quầy dịch vụ khách hàng tại Sảnh chính Fis Hotel",
                timeline: [
                  { time: "08:00 - 08:30", title: "Gặp gỡ Hướng dẫn viên & Chuẩn bị di chuyển", desc: "Tập trung tại quầy dịch vụ sảnh chính khách sạn, gặp gỡ hướng dẫn viên và chuẩn bị xe du lịch của khách sạn." },
                  { time: "08:30 - 11:30", title: "Khám phá danh lam thắng cảnh", desc: "Bắt đầu hành trình tham quan và trải nghiệm thực tế điểm đến theo hành trình của tour." },
                  { time: "11:30 - 13:00", title: "Ăn trưa & Nghỉ ngơi", desc: "Thưởng thức ẩm thực đặc trưng địa phương tại nhà hàng đối tác của Fis Hotel." },
                  { time: "13:00 - 16:30", title: "Hoạt động trải nghiệm & Tự do", desc: "Tiếp tục các hoạt động trải nghiệm, chụp ảnh kỷ niệm lưu niệm và khám phá phong cảnh xung quanh." },
                  { time: "16:30 - 17:00", title: "Kết thúc hành trình & Đưa đón về khách sạn", desc: "Tập hợp đoàn và xe du lịch đưa đón của Fis Hotel đón quý khách trở lại khách sạn an toàn." }
                ]
              }
            };

            const currentItinerary = itineraries[tourKey] || itineraries.default;

            return (
              <div className="border-t border-neutral-200 dark:border-neutral-700 py-6 my-6 space-y-4 print:border-t">
                <h4 className="font-extrabold text-base text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-5 h-5" /> Lịch Trình Chi Tiết & Hướng Dẫn Trải Nghiệm
                </h4>
                
                <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                  <div>
                    <strong className="text-neutral-500">Giờ tập trung:</strong> <span className="font-bold text-neutral-800 dark:text-neutral-200">{currentItinerary.gatheringTime}</span>
                  </div>
                  <div>
                    <strong className="text-neutral-500">Địa điểm tập trung:</strong> <span className="font-bold text-neutral-800 dark:text-neutral-200">{currentItinerary.gatheringLocation}</span>
                  </div>
                </div>

                <div className="relative border-l-2 border-emerald-100 dark:border-emerald-900/60 ml-3 pl-4 space-y-4">
                  {currentItinerary.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Dot indicator */}
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900"></div>
                      
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-emerald-600 block">{step.time}</span>
                        <span className="font-bold text-xs text-neutral-900 dark:text-white block">{step.title}</span>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="flex justify-end border-t border-neutral-200 dark:border-neutral-700 pt-8">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>VAT ({(invoice.vat_rate * 100).toFixed(0)}%)</span>
                <span>{formatMoney(invoice.vat_amount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-neutral-200 dark:border-neutral-700 pt-3">
                <span>Grand Total</span>
                <span>{formatMoney(invoice.grand_total)}</span>
              </div>
              
              {invoice.payments.length > 0 && (
                <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="text-sm font-semibold mb-2">Payments Received:</div>
                  {invoice.payments.map(p => (
                    <div key={p.id} className="flex justify-between text-sm text-green-600">
                      <span>{new Date(p.created_at).toLocaleDateString()} ({p.method})</span>
                      <span>-{formatMoney(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-lg font-bold text-red-600 mt-2 border-t border-neutral-200 dark:border-neutral-700 pt-2">
                    <span>Balance Due</span>
                    <span>{formatMoney(invoice.balance_due)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checkout Action (Staff Only) */}
        {canCheckout && (
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 sm:p-8 rounded-3xl space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h3 className="font-extrabold text-xl text-neutral-900 dark:text-white">Front Desk Payment Settlement & Checkout</h3>
                <p className="text-neutral-500 text-sm mt-0.5">Select guest payment method and confirm check-out to release room to housekeeping.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block uppercase font-bold">Balance Due</span>
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{formatMoney(invoice.balance_due)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Choose Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["CARD", "CASH", "BANK_TRANSFER"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`py-3 px-4 rounded-2xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedPaymentMethod === method
                        ? "border-amber-600 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 ring-2 ring-amber-500/30"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span>{method === "CARD" ? "💳 POS / Credit Card" : method === "CASH" ? "💵 Cash at Counter" : "🏦 Bank Transfer / QR"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <ButtonPrimary
                onClick={handleCheckout}
                loading={checkoutLoading}
                disabled={checkoutLoading || invoice.balance_due < 0}
                className="w-full sm:w-auto px-8 h-12 text-base font-bold bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/25"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                <span>Confirm Check-Out ({selectedPaymentMethod})</span>
              </ButtonPrimary>
            </div>
          </div>
        )}
      </div>

      {/* CANCEL MODAL */}
      <Transition appear show={cancelModalOpen} as={React.Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => !isCancelling && setCancelModalOpen(false)}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-40" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-neutral-900 shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {isExp ? "Xác nhận hủy đặt dịch vụ trải nghiệm" : "Xác nhận hủy đặt phòng"}
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                  Bạn có chắc chắn muốn hủy đặt {isExp ? "dịch vụ trải nghiệm" : "phòng"}{" "}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {b?.id.split("-")[0].toUpperCase()}
                  </span>
                  ?
                  {isStaff ? (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl font-medium text-left">
                      Lưu ý: Tiền {isExp ? "thanh toán dịch vụ" : "cọc"} sẽ được hoàn trả lại cho khách hàng.
                      <textarea
                        className="w-full mt-3 p-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-neutral-900 text-sm font-normal text-neutral-700 dark:text-neutral-300"
                        placeholder={isExp ? "Nhập lý do hủy đặt trải nghiệm..." : "Nhập lý do hủy phòng..."}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl font-medium">
                      {isExp ? (
                        "Lưu ý: Hủy đặt trải nghiệm sẽ được hoàn trả tiền theo chính sách hủy dịch vụ của khách sạn. Hành động này không thể hoàn tác."
                      ) : (
                        `Lưu ý: Hủy phòng sẽ làm bạn mất khoản tiền cọc là 10% tổng giá trị ban đầu (${formatMoney((b?.total_amount || invoice?.grand_total || 0) * 0.1)}). Hành động này không thể hoàn tác.`
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <ButtonSecondary onClick={() => setCancelModalOpen(false)} disabled={isCancelling}>
                    Không, giữ lại
                  </ButtonSecondary>
                  <ButtonPrimary onClick={handleCancelBooking} loading={isCancelling} className="bg-red-600 hover:bg-red-700">
                    Đồng ý hủy
                  </ButtonPrimary>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
