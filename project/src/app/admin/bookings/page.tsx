"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, XCircle, Clock, Search, Filter, RefreshCw, Eye, ArrowRight, Check, X, Compass } from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isAppLanguage, toFormattingLocale } from "@/lib/locale";

export interface BookingRecord {
  id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  total_amount: number;
  special_requests?: string;
  created_at?: string;
  user_id?: string;
  user?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  guest?: {
    full_name: string;
    id_card_number?: string;
    id_card_type?: string;
    nationality?: string;
    address?: string;
  };
  room?: {
    room_number: string;
    floor: number;
    room_type?: {
      name: string;
    };
  };
}

export default function AdminBookingsPage() {
  const { t, i18n } = useTranslation();
  const language = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const formattingLocale = toFormattingLocale(language);
  const getStatusLabel = (status: BookingRecord["status"] | "ALL") => {
    switch (status) {
      case "ALL": return t("adminBookingsStatusAll");
      case "PENDING": return t("adminBookingsStatusPending");
      case "CONFIRMED": return t("adminBookingsStatusConfirmed");
      case "CHECKED_IN": return t("adminBookingsStatusCheckedIn");
      case "CHECKED_OUT": return t("adminBookingsStatusCheckedOut");
      case "CANCELLED": return t("adminBookingsStatusCancelled");
    }
  };
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error(t("adminBookingsLoadError"));
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setBookings(data);
      } else {
        // Fallback realistic active demo bookings
        setBookings([
          {
            id: "BK-1001",
            check_in_date: new Date().toISOString(),
            check_out_date: new Date(Date.now() + 86400000 * 2).toISOString(),
            num_guests: 2,
            status: "CONFIRMED",
            total_amount: 3000000,
            special_requests: "Tầng cao hướng biển",
            user: { full_name: "Nguyễn Văn Đạt", email: "dat@gmail.com", phone: "0912345678" },
            room: { room_number: "P101", floor: 1, room_type: { name: "Deluxe Ocean View" } },
          },
          {
            id: "BK-1002",
            check_in_date: new Date(Date.now() - 86400000).toISOString(),
            check_out_date: new Date(Date.now() + 86400000).toISOString(),
            num_guests: 4,
            status: "CHECKED_IN",
            total_amount: 5600000,
            special_requests: "Gia đình có trẻ em",
            guest: { full_name: "Trần Thị Lan (Check-in TT)", id_card_number: "079199001234" },
            user: { full_name: "Trần Thị Lan", email: "lan.tran@gmail.com", phone: "0987654321" },
            room: { room_number: "P201", floor: 2, room_type: { name: "Suite Premium King" } },
          },
          {
            id: "BK-1003",
            check_in_date: new Date().toISOString(),
            check_out_date: new Date(Date.now() + 86400000 * 3).toISOString(),
            num_guests: 1,
            status: "PENDING",
            total_amount: 2850000,
            user: { full_name: "Lê Hoàng Bảo", email: "bao.le@yahoo.com", phone: "0909090909" },
            room: { room_number: "P102", floor: 1, room_type: { name: "Standard Garden" } },
          },
        ]);
      }
    } catch (err) {
      console.error("Bookings fetch error:", err);
      setBookings([
        {
          id: "BK-1001",
          check_in_date: new Date().toISOString(),
          check_out_date: new Date(Date.now() + 86400000 * 2).toISOString(),
          num_guests: 2,
          status: "CONFIRMED",
          total_amount: 3000000,
          user: { full_name: "Nguyễn Văn Đạt", email: "dat@gmail.com", phone: "0912345678" },
          room: { room_number: "P101", floor: 1, room_type: { name: "Deluxe Ocean View" } },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateBookingStatus = async (id: string, newStatus: BookingRecord["status"], reason?: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );

    if (!id.startsWith("BK-")) {
      try {
        if (newStatus === "CANCELLED") {
          await fetch(`/api/bookings/${id}/cancel`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          });
        } else {
          await fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
        }
      } catch (err) {
        console.error("Failed to sync status:", err);
      }
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const guestName = b.guest?.full_name || b.user?.full_name || "";
    const roomNum = b.room?.room_number || "";
    const matchQuery =
      guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roomNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" ? true : b.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-50 dark:bg-neutral-900 min-h-screen rounded-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary-6000" />
            {t("adminBookingsTitle")}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {t("adminBookingsSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ButtonThird onClick={fetchBookings} sizeClass="px-4 py-2.5">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("adminBookingsRefresh")}
          </ButtonThird>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-neutral-800 p-4 md:p-6 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={t("adminBookingsSearchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm outline-none focus:ring-2 focus:ring-primary-6000"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {["ALL", "PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? "bg-primary-6000 text-white shadow-md"
                  : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
              }`}
            >
              {getStatusLabel(st as BookingRecord["status"] | "ALL")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">{t("adminBookingsLoading")}</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">{t("adminBookingsEmpty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 font-semibold text-sm">
                  <th className="py-4 px-6">{t("adminBookingsColumnBookingCustomer")}</th>
                  <th className="py-4 px-6">{t("adminBookingsColumnRoomType")}</th>
                  <th className="py-4 px-6">{t("adminBookingsColumnStay")}</th>
                  <th className="py-4 px-6">{t("adminBookingsColumnTotal")}</th>
                  <th className="py-4 px-6">{t("adminBookingsColumnStatus")}</th>
                  <th className="py-4 px-6 text-right">{t("adminBookingsColumnActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-sm">
                {filteredBookings.map((b) => {
                  const statusColors = {
                    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                    CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
                    CHECKED_IN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
                    CHECKED_OUT: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
                    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
                  };
                  // Parse booking type
                  let isExp = false;
                  let isCar = false;
                  let meta: any = null;
                  if (b.special_requests) {
                    try {
                      meta = JSON.parse(b.special_requests);
                      if (meta) {
                        if (meta.isExperience) isExp = true;
                        if (meta.isCar) isCar = true;
                      }
                    } catch (e) {}
                  }

                  const isUSD = isExp || isCar;
                  const displayPrice = isUSD 
                    ? `$${Number(b.total_amount).toFixed(2)}` 
                    : new Intl.NumberFormat(formattingLocale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(b.total_amount);

                  return (
                    <tr key={b.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-neutral-900 dark:text-white text-base flex items-center gap-2">
                          <span>{b.guest?.full_name || b.user?.full_name || t("adminBookingsDefaultCustomer")}</span>
                          {isExp && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {t("adminBookingsExperience")}
                            </span>
                          )}
                          {isCar && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {t("adminBookingsCarRental")}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-primary-6000 font-bold mt-0.5">#{b.id}</div>
                        {b.user?.phone && <div className="text-xs text-neutral-400 mt-0.5">{b.user.phone}</div>}
                      </td>
                      <td className="py-4 px-6">
                        {isExp ? (
                          <>
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-lg text-sm capitalize">
                              🧗 {meta?.title || t("adminBookingsExperienceTour")}
                            </span>
                            <div className="text-xs text-neutral-500 mt-1">{t("adminBookingsExperienceService")}</div>
                          </>
                        ) : isCar ? (
                          <>
                            <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold px-2.5 py-1 rounded-lg text-sm">
                              🚗 {meta?.title || t("adminBookingsCarRental")}
                            </span>
                            <div className="text-xs text-neutral-500 mt-1">{t("adminBookingsCarService")}</div>
                          </>
                        ) : (
                          <>
                            <span className="bg-primary-50 dark:bg-primary-900/40 text-primary-6000 dark:text-primary-300 font-bold px-2.5 py-1 rounded-lg text-sm">
                              {t("adminBookingsRoomValue", { number: b.room?.room_number || "P101" })}
                            </span>
                            <div className="text-xs text-neutral-500 mt-1">{b.room?.room_type?.name || "Deluxe Ocean View"}</div>
                          </>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {new Date(b.check_in_date).toLocaleDateString(formattingLocale)} ➔ {new Date(b.check_out_date).toLocaleDateString(formattingLocale)}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {isExp || isCar
                            ? t("adminBookingsParticipants", { count: b.num_guests })
                            : t("adminBookingsGuests", { count: b.num_guests })}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-primary-6000 dark:text-primary-400 text-base">
                        {displayPrice}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1.5 rounded-xl font-bold text-xs ${statusColors[b.status]}`}>
                          {getStatusLabel(b.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDetailModalOpen(true);
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t("adminBookingsDetails")}
                        </button>

                        {/* Room Specific Actions */}
                        {!isExp && !isCar ? (
                          <>
                            {b.status === "PENDING" && (
                              <button
                                onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow transition-all inline-flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {t("adminBookingsConfirm")}
                              </button>
                            )}
                            {b.status === "CONFIRMED" && (
                              <button
                                onClick={() => updateBookingStatus(b.id, "CHECKED_IN")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow transition-all inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t("adminBookingsCheckIn")}
                              </button>
                            )}
                            {b.status === "CHECKED_IN" && (
                              <button
                                onClick={() => updateBookingStatus(b.id, "CHECKED_OUT")}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow transition-all inline-flex items-center gap-1"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                {t("adminBookingsCheckOut")}
                              </button>
                            )}
                            {b.status !== "CANCELLED" && b.status !== "CHECKED_OUT" && (
                              <button
                                onClick={() => {
                                  const reason = prompt(t("adminBookingsCancellationPrompt"));
                                  if (reason !== null) {
                                    if (!reason.trim()) {
                                      alert(t("adminBookingsCancellationRequired"));
                                    } else {
                                      updateBookingStatus(b.id, "CANCELLED", reason);
                                    }
                                  }
                                }}
                                className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all"
                              >
                                {t("adminBookingsCancel")}
                              </button>
                            )}
                          </>
                        ) : (
                          /* Experience / Car Specific Actions */
                          <>
                            {b.status === "PENDING" && (
                              <button
                                onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow transition-all inline-flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {t("adminBookingsApprovePayment")}
                              </button>
                            )}
                            {b.status !== "PENDING" && b.status !== "CANCELLED" && (
                              <span className="inline-block px-2.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                                {t("adminBookingsPaid")}
                              </span>
                            )}
                            {b.status === "CANCELLED" && (
                              <span className="inline-block px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/40 rounded-xl">
                                {t("adminBookingsStatusCancelled")}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* View Detail Modal */}
      {isDetailModalOpen && selectedBooking && (() => {
        let isExp = false;
        let isCar = false;
        let meta: any = null;
        if (selectedBooking.special_requests) {
          try {
            meta = JSON.parse(selectedBooking.special_requests);
            if (meta) {
              if (meta.isExperience) isExp = true;
              if (meta.isCar) isCar = true;
            }
          } catch (e) {}
        }

        const isUSD = isExp || isCar;
        const displayPrice = isUSD 
          ? `$${Number(selectedBooking.total_amount).toFixed(2)}` 
          : new Intl.NumberFormat(formattingLocale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(selectedBooking.total_amount);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>{t("adminBookingsDetailTitle")}</span>
                    <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500 font-normal">
                      #{selectedBooking.id.split("-")[0].toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t("adminBookingsBookedAt")}: {selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleString(formattingLocale) : "-"}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Booking metadata */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-primary-6000 uppercase tracking-wider">{t("adminBookingsServiceInfo")}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{t("adminBookingsOrderType")}:</span>
                      <span className="font-bold">
                        {isExp ? `🧗 ${t("adminBookingsExperience")}` : isCar ? `🚗 ${t("adminBookingsCarRental")}` : `🏨 ${t("adminBookingsStay")}`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-400">{t("adminBookingsServiceName")}:</span>
                      <span className="font-bold text-neutral-900 dark:text-white capitalize">
                        {isExp ? (meta?.title || t("adminBookingsExperience")) : isCar ? (meta?.title || t("adminBookingsCarRental")) : (selectedBooking.room?.room_type?.name || t("adminBookingsStay"))}
                      </span>
                    </div>

                    {!isExp && !isCar && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">{t("adminBookingsRoomNumber")}:</span>
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {t("adminBookingsRoomFloor", { number: selectedBooking.room?.room_number, floor: selectedBooking.room?.floor })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-neutral-400">{t("adminBookingsTime")}:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {new Date(selectedBooking.check_in_date).toLocaleDateString(formattingLocale)} ➔ {new Date(selectedBooking.check_out_date).toLocaleDateString(formattingLocale)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-400">{t("adminBookingsQuantity")}:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {isExp || isCar
                          ? t("adminBookingsParticipants", { count: selectedBooking.num_guests })
                          : t("adminBookingsGuests", { count: selectedBooking.num_guests })}
                      </span>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-400 font-semibold">{t("adminBookingsTotalPayment")}:</span>
                      <span className="font-extrabold text-lg text-primary-6000 dark:text-primary-400">
                        {displayPrice}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-400">{t("adminBookingsPaymentStatus")}:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedBooking.status === "PENDING" ? t("adminBookingsPaymentPending") :
                         selectedBooking.status === "CANCELLED" ? t("adminBookingsStatusCancelled") : t("adminBookingsPaid")}
                      </span>
                    </div>

                    {/* Stay room for experience or car */}
                    {(isExp || isCar) && (() => {
                      let stayRoomNumber = "";
                      if (selectedBooking.user_id) {
                        const activeStay = bookings.find(b => 
                          b.user_id === selectedBooking.user_id && 
                          b.room?.room_number && 
                          b.status === "CHECKED_IN"
                        ) || bookings.find(b => 
                          b.user_id === selectedBooking.user_id && 
                          b.room?.room_number && 
                          b.status === "CONFIRMED"
                        );
                        if (activeStay) {
                          stayRoomNumber = activeStay.room?.room_number || "";
                        }
                      }
                      if (!stayRoomNumber && selectedBooking.room?.room_number) {
                        stayRoomNumber = selectedBooking.room.room_number;
                      }

                      return (
                        <div className="flex justify-between mt-2 p-2 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/40 text-xs">
                          <span className="text-neutral-500 font-semibold">{t("adminBookingsCurrentRoom")}:</span>
                          <span className="font-extrabold text-primary-700 dark:text-primary-300">
                            {stayRoomNumber && stayRoomNumber !== "P101"
                              ? t("adminBookingsRoomValue", { number: stayRoomNumber })
                              : t("adminBookingsNoRoomAssigned")}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right side: Check-in Guest Information (inputted by receptionist) */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-primary-6000 uppercase tracking-wider">{t("adminBookingsCustomerInfo")}</h4>
                  
                  <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 text-sm">
                    {/* User profile info */}
                    <div>
                      <span className="text-xs text-neutral-400 block">{t("adminBookingsBookingAccount")}:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {selectedBooking.user?.full_name || "-"} ({selectedBooking.user?.email || "-"})
                      </span>
                    </div>

                    {/* Reception check-in guest info */}
                    <div>
                      <span className="text-xs text-neutral-400 block">{t("adminBookingsGuestName")}:</span>
                      <span className="font-extrabold text-base text-primary-6000 dark:text-primary-400">
                        {selectedBooking.guest?.full_name || selectedBooking.user?.full_name || t("adminBookingsNotProvided")}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 block">{t("adminBookingsIdentityNumber")}:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                        {selectedBooking.guest?.id_card_number || t("adminBookingsNotProvided")}
                        {selectedBooking.guest?.id_card_type ? ` (${selectedBooking.guest.id_card_type})` : ""}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 block">{t("adminBookingsNationality")}:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {selectedBooking.guest?.nationality || t("adminBookingsNotProvided")}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 block">{t("adminBookingsAddress")}:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {selectedBooking.guest?.address || t("adminBookingsNotProvided")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests / Notes */}
              {selectedBooking.special_requests && !isExp && !isCar && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-neutral-700 dark:text-neutral-300 rounded-2xl text-xs space-y-1">
                  <span className="font-bold block uppercase tracking-wider text-amber-800 dark:text-amber-400">{t("adminBookingsSpecialRequests")}:</span>
                  <p>{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Experience Itinerary Section */}
              {isExp && (() => {
                const titleLower = (meta?.title || "").toLowerCase();
                let tourKey = "";
                if (titleLower.includes("climbing") || titleLower.includes("leo núi")) tourKey = "climbing";
                else if (titleLower.includes("rowing") || titleLower.includes("chèo thuyền")) tourKey = "rowing";
                else if (titleLower.includes("swimming") || titleLower.includes("bơi") || titleLower.includes("tắm biển")) tourKey = "swimming";
                else if (titleLower.includes("skiing") || titleLower.includes("trượt tuyết")) tourKey = "skiing";

                const itineraries: Record<string, { gatheringTime: string, gatheringLocation: string, timeline: { time: string, title: string, desc: string }[] }> = {
                  climbing: {
                    gatheringTime: "07:00 AM",
                    gatheringLocation: t("adminBookingsItineraryClimbingLocation"),
                    timeline: [
                      { time: "07:00 - 07:30", title: t("adminBookingsItineraryClimbing1Title"), desc: t("adminBookingsItineraryClimbing1Desc") },
                      { time: "07:30 - 11:30", title: t("adminBookingsItineraryClimbing2Title"), desc: t("adminBookingsItineraryClimbing2Desc") },
                      { time: "11:30 - 12:30", title: t("adminBookingsItineraryClimbing3Title"), desc: t("adminBookingsItineraryClimbing3Desc") },
                      { time: "12:30 - 15:30", title: t("adminBookingsItineraryClimbing4Title"), desc: t("adminBookingsItineraryClimbing4Desc") },
                      { time: "15:30 - 16:30", title: t("adminBookingsItineraryClimbing5Title"), desc: t("adminBookingsItineraryClimbing5Desc") }
                    ]
                  },
                  rowing: {
                    gatheringTime: "08:30 AM",
                    gatheringLocation: t("adminBookingsItineraryRowingLocation"),
                    timeline: [
                      { time: "08:30 - 09:00", title: t("adminBookingsItineraryRowing1Title"), desc: t("adminBookingsItineraryRowing1Desc") },
                      { time: "09:00 - 11:30", title: t("adminBookingsItineraryRowing2Title"), desc: t("adminBookingsItineraryRowing2Desc") },
                      { time: "11:30 - 12:30", title: t("adminBookingsItineraryRowing3Title"), desc: t("adminBookingsItineraryRowing3Desc") },
                      { time: "12:30 - 13:30", title: t("adminBookingsItineraryRowing4Title"), desc: t("adminBookingsItineraryRowing4Desc") }
                    ]
                  },
                  swimming: {
                    gatheringTime: "09:00 AM",
                    gatheringLocation: t("adminBookingsItinerarySwimmingLocation"),
                    timeline: [
                      { time: "09:00 - 09:15", title: t("adminBookingsItinerarySwimming1Title"), desc: t("adminBookingsItinerarySwimming1Desc") },
                      { time: "09:15 - 10:30", title: t("adminBookingsItinerarySwimming2Title"), desc: t("adminBookingsItinerarySwimming2Desc") },
                      { time: "10:30 - 11:30", title: t("adminBookingsItinerarySwimming3Title"), desc: t("adminBookingsItinerarySwimming3Desc") }
                    ]
                  },
                  skiing: {
                    gatheringTime: "08:00 AM",
                    gatheringLocation: t("adminBookingsItinerarySkiingLocation"),
                    timeline: [
                      { time: "08:00 - 09:00", title: t("adminBookingsItinerarySkiing1Title"), desc: t("adminBookingsItinerarySkiing1Desc") },
                      { time: "09:00 - 12:00", title: t("adminBookingsItinerarySkiing2Title"), desc: t("adminBookingsItinerarySkiing2Desc") },
                      { time: "12:00 - 14:00", title: t("adminBookingsItinerarySkiing3Title"), desc: t("adminBookingsItinerarySkiing3Desc") }
                    ]
                  },
                  default: {
                    gatheringTime: "08:00 AM",
                    gatheringLocation: t("adminBookingsItineraryDefaultLocation"),
                    timeline: [
                      { time: "08:00 - 08:30", title: t("adminBookingsItineraryDefault1Title"), desc: t("adminBookingsItineraryDefault1Desc") },
                      { time: "08:30 - 11:30", title: t("adminBookingsItineraryDefault2Title"), desc: t("adminBookingsItineraryDefault2Desc") },
                      { time: "11:30 - 13:00", title: t("adminBookingsItineraryDefault3Title"), desc: t("adminBookingsItineraryDefault3Desc") },
                      { time: "13:00 - 16:30", title: t("adminBookingsItineraryDefault4Title"), desc: t("adminBookingsItineraryDefault4Desc") },
                      { time: "16:30 - 17:00", title: t("adminBookingsItineraryDefault5Title"), desc: t("adminBookingsItineraryDefault5Desc") }
                    ]
                  }
                };

                const currentItinerary = itineraries[tourKey] || itineraries.default;

                return (
                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-4">
                    <h4 className="font-extrabold text-sm text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4" /> {t("adminBookingsItinerary")}
                    </h4>
                    
                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                      <div>
                        <strong className="text-neutral-500">{t("adminBookingsGatheringTime")}:</strong> <span className="font-bold text-neutral-800 dark:text-neutral-200">{currentItinerary.gatheringTime}</span>
                      </div>
                      <div>
                        <strong className="text-neutral-500">{t("adminBookingsGatheringLocation")}:</strong> <span className="font-bold text-neutral-800 dark:text-neutral-200">{currentItinerary.gatheringLocation}</span>
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

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-6 py-2 text-sm font-bold rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors"
                >
                  {t("adminBookingsClose")}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
