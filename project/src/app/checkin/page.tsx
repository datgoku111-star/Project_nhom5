"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import type { Booking, Room } from "@/types/hotel";
import ReceptionistServiceHub from "@/components/ReceptionistServiceHub";
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  Home, 
  FileText, 
  Phone, 
  RefreshCw, 
  CreditCard, 
  LogOut, 
  LogIn, 
  PlusCircle, 
  BedDouble,
  DollarSign,
  Utensils
} from "lucide-react";

import DashboardLayout from "../dashboard/layout";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isAppLanguage, toFormattingLocale } from "@/lib/locale";

function CheckInContent() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlBookingId = searchParams?.get("bookingId");
  const urlMode = searchParams?.get("mode");
  const urlRoomId = searchParams?.get("roomId");
  const urlCheckIn = searchParams?.get("checkIn");
  const urlCheckOut = searchParams?.get("checkOut");

  // Modes: 'checkin' | 'checkout' | 'walkin' | 'services'
  const [activeTab, setActiveTab] = useState<"checkin" | "checkout" | "walkin" | "services">(
    urlMode === "checkout" ? "checkout" : urlMode === "services" ? "services" : urlRoomId ? "walkin" : "checkin"
  );

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);

  // Walk-in State
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [walkInDates, setWalkInDates] = useState({
    check_in: urlCheckIn || new Date().toISOString().split("T")[0],
    check_out: urlCheckOut || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    })(),
    num_guests: 1,
  });

  const [guestForm, setGuestForm] = useState({
    full_name: "",
    id_card_number: "",
    id_card_type: "CCCD",
    nationality: "Vietnam",
    address: "",
  });

  // Check-Out Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [showQR, setShowQR] = useState(false);
  const [payosQRUrl, setPayosQRUrl] = useState<string | null>(null);
  const [payosOrderCode, setPayosOrderCode] = useState<number | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [checkoutDetails, setCheckoutDetails] = useState<any | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Action Loading & Messages
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !["ADMIN", "RECEPTIONIST"].includes(user.role))) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && ["ADMIN", "RECEPTIONIST"].includes(user.role)) {
      if (activeTab === "walkin") {
        fetchAvailableRoomsForWalkIn();
      } else {
        handleSearchQuery("", activeTab === "checkout" ? "CHECKED_IN" : "CONFIRMED");
      }
    }
  }, [user, activeTab, walkInDates.check_in, walkInDates.check_out]);

  // Handle auto-selection if bookingId or roomId is passed in URL
  useEffect(() => {
    if (urlBookingId && searchResults.length > 0) {
      const found = searchResults.find((b) => b.id === urlBookingId);
      if (found) {
        handleSelectBooking(found);
      }
    }
  }, [urlBookingId, searchResults]);

  useEffect(() => {
    if (urlRoomId && availableRooms.length > 0) {
      const found = availableRooms.find((r) => r.id === urlRoomId);
      if (found) {
        setSelectedRoom(found);
      }
    }
  }, [urlRoomId, availableRooms]);

  const fetchAvailableRoomsForWalkIn = async () => {
    try {
      const res = await fetch(`/api/rooms?checkIn=${walkInDates.check_in}&checkOut=${walkInDates.check_out}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableRooms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching rooms for walkin:", err);
    }
  };

  const fetchCheckoutDetails = async (bookingId: string) => {
    setLoadingCheckout(true);
    try {
      const res = await fetch(`/api/checkin/${bookingId}/checkout`);
      if (res.ok) {
        const data = await res.json();
        setCheckoutDetails(data);
        setCustomAmount(data.grand_total || 0);
      } else {
        console.error("Failed to fetch checkout details");
      }
    } catch (err) {
      console.error("Error fetching checkout details:", err);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleSearchQuery = async (query: string, statusFilter?: string) => {
    setIsSearching(true);
    setError("");
    try {
      let url = `/api/bookings/search?query=${encodeURIComponent(query.trim())}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      } else if (activeTab === "checkout") {
        url += `&status=CHECKED_IN`;
      } else if (activeTab === "checkin") {
        url += `&status=CONFIRMED`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(t("checkinSearchFailed"));
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t("checkinSearchError"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchQuery(searchKeyword);
  };

  const handleSelectBooking = (selected: any) => {
    setError("");
    setSuccess("");
    if (["CANCELLED", "CHECKED_OUT"].includes(selected.status)) {
      setError(t("checkinCannotProcessStatus", { status: selected.status }));
      return;
    }
    setBooking(selected);

    // Switch tab automatically based on status if needed
    if (selected.status === "CHECKED_IN") {
      setActiveTab("checkout");
      setTransactionRef("TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase());
      fetchCheckoutDetails(selected.id);
    } else if (selected.status === "CONFIRMED" || selected.status === "PENDING") {
      setActiveTab("checkin");
      setCheckoutDetails(null);
      if (selected.guest) {
        setGuestForm({
          full_name: selected.guest.full_name || "",
          id_card_number: selected.guest.id_card_number || "",
          id_card_type: selected.guest.id_card_type || "CCCD",
          nationality: selected.guest.nationality || "Vietnam",
          address: selected.guest.address || "",
        });
      } else {
        const defaultName = selected.user?.full_name || "";
        setGuestForm({
          full_name: defaultName,
          id_card_number: "",
          id_card_type: "CCCD",
          nationality: "Vietnam",
          address: "",
        });
      }
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  const getAmountToSettle = () => {
    if (customAmount !== null) return customAmount;
    let baseAmount = checkoutDetails?.grand_total || booking?.total_amount || 0;
    const numericVal = typeof baseAmount === 'number' ? baseAmount : parseFloat(baseAmount as any) || 0;
    const vndVal = numericVal < 1000 ? numericVal * 25000 : numericVal;
    return Math.round(vndVal);
  };

  const formatMoney = (val: number) => {
    const numericVal = typeof val === 'number' ? val : parseFloat(val as any) || 0;
    const vndVal = numericVal < 1000 ? numericVal * 25000 : numericVal;
    const language = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
    return new Intl.NumberFormat(toFormattingLocale(language), { style: "currency", currency: "VND" }).format(Math.round(vndVal));
  };

  // Action 1: Confirm Check-In
  const confirmCheckIn = async () => {
    if (!booking) return;
    if (!guestForm.full_name || !guestForm.id_card_number) {
      setError(t("checkinGuestIdentityRequired"));
      return;
    }
    if (guestForm.id_card_number.length < 12) {
      setError(t("checkinIdMinimumLength"));
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          guest: guestForm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("checkinFailed"));
      }

      setSuccess(t("checkinSuccess", { room: booking.room?.room_number, type: booking.room?.room_type?.name }));
      setTimeout(() => {
        setBooking(null);
        setSuccess("");
        handleSearchQuery(searchKeyword);
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 2: Confirm Check-Out & Settle Bill
  const handleCheckoutClick = async () => {
    if (paymentMethod === "BANK_TRANSFER" && !showQR) {
      setActionLoading(true);
      setError("");
      try {
        const amountToPay = customAmount !== null ? customAmount : getAmountToSettle();
        const payOSRes = await fetch("http://localhost:5000/api/payment/create-embedded-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking?.id || "",
            type: "checkout",
            roomName: `Checkout Room ${booking?.room?.room_number}`,
            totalPrice: amountToPay,
          }),
        });
        const payOSData = await payOSRes.json();
        if (!payOSRes.ok) throw new Error(payOSData.error || t("checkinPayOSCreateError"));
        
        setPayosQRUrl(payOSData.qrCode);
        setPayosOrderCode(payOSData.orderCode);
        setShowQR(true);
      } catch (err: any) {
        setError(err.message || t("checkinVietQRCreateError"));
      } finally {
        setActionLoading(false);
      }
      return;
    }
    confirmCheckOut();
  };

  const confirmCheckOut = async () => {
    if (!booking) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      if (paymentMethod === "BANK_TRANSFER") {
        if (!payosOrderCode) throw new Error(t("checkinCreateQRFirst"));
        const checkRes = await fetch(`/api/payment/check/${payosOrderCode}`);
        const checkData = await checkRes.json();
        if (!checkRes.ok) throw new Error(checkData.error || t("checkinPaymentStatusError"));
        if (checkData.status !== "PAID") {
          throw new Error(t("checkinPaymentNotCompleted"));
        }
      }

      const res = await fetch(`/api/checkin/${booking.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod === "BANK_TRANSFER" ? "TRANSFER" : paymentMethod,
          amount: customAmount !== null ? customAmount : getAmountToSettle(),
          transaction_ref: transactionRef || "TXN-COUNTER-" + Date.now(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("checkinCheckoutFailed"));
      }

      setSuccess(t("checkinCheckoutSuccess", { room: booking.room?.room_number }));
      setTimeout(() => {
        setBooking(null);
        setSuccess("");
        handleSearchQuery(searchKeyword);
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: Process Instant Walk-In Check-In
  const confirmWalkInCheckIn = async () => {
    if (!selectedRoom) {
      setError(t("checkinSelectAvailableRoom"));
      return;
    }
    if (!guestForm.full_name || !guestForm.id_card_number) {
      setError(t("checkinGuestIdentityRequired"));
      return;
    }
    if (guestForm.id_card_number.length < 12) {
      setError(t("checkinIdMinimumLength"));
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    const nights = calculateNights(walkInDates.check_in, walkInDates.check_out);
    const totalAmount = nights * (selectedRoom.room_type?.base_price || (selectedRoom.room_type as any)?.base_price_per_night || 0);

    try {
      // 1. Create booking
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          check_in_date: walkInDates.check_in,
          check_out_date: walkInDates.check_out,
          num_guests: walkInDates.num_guests,
          total_amount: totalAmount,
          special_requests: "Instant Walk-In Reservation at Front Desk",
        }),
      });

      if (!bookRes.ok) {
        const bookData = await bookRes.json();
        throw new Error(bookData.error || t("checkinWalkInCreateFailed"));
      }
      const newBooking = await bookRes.json();

      // 2. Immediately Check-In the guest
      const checkinRes = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: newBooking.id,
          guest: guestForm,
        }),
      });

      if (!checkinRes.ok) {
        const checkinData = await checkinRes.json();
        throw new Error(checkinData.error || t("checkinWalkInStepFailed"));
      }

      setSuccess(t("checkinWalkInSuccess", { room: selectedRoom.room_number, guest: guestForm.full_name }));
      setTimeout(() => {
        setSelectedRoom(null);
        setGuestForm({
          full_name: "",
          id_card_number: "",
          id_card_type: "CCCD",
          nationality: "Vietnam",
          address: "",
        });
        setSuccess("");
        fetchAvailableRoomsForWalkIn();
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800";
      case "PENDING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "CHECKED_IN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
      case "CHECKED_OUT":
        return "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetAllSelectionAndErrors = (tab: "checkin" | "checkout" | "walkin") => {
    setActiveTab(tab);
    setBooking(null);
    setSelectedRoom(null);
    setError("");
    setSuccess("");
    setCheckoutDetails(null);
    setGuestForm({
      full_name: "",
      id_card_number: "",
      id_card_type: "CCCD",
      nationality: "Vietnam",
      address: "",
    });
  };

  if (isLoading) return <div className="container py-20 text-center">{t("checkinLoading")}</div>;

  return (
    <div className="container py-10 mb-24 lg:mb-32 space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 dark:border-neutral-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-neutral-900 dark:text-white flex items-center gap-3">
            <span>{t("checkinPortalTitle")}</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            {t("checkinPortalSubtitle")}
          </p>
        </div>

        {/* Operating Mode Tabs */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => resetAllSelectionAndErrors("checkin")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "checkin"
                ? "bg-primary-6000 text-white shadow-md shadow-primary-6000/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{t("checkinDeskTab")}</span>
          </button>

          <button
            onClick={() => resetAllSelectionAndErrors("checkout")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "checkout"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>{t("checkinCheckoutBillingTab")}</span>
          </button>

          <button
            onClick={() => resetAllSelectionAndErrors("walkin")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "walkin"
                ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("checkinWalkInTab")}</span>
          </button>

          <button
            onClick={() => { setActiveTab("services"); setBooking(null); setError(""); setSuccess(""); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "services"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>{t("checkinServicesTab")}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 border border-green-200 text-green-800 dark:bg-green-950/60 dark:border-green-800 dark:text-green-200 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Layout depending on active tab */}
      {activeTab === "services" ? (
        <ReceptionistServiceHub />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Search / Selection List */}
        <div className="lg:col-span-6 space-y-6">
          {activeTab !== "walkin" ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center justify-between text-neutral-900 dark:text-white">
                <span>{t("checkinStepSearchSelect", { target: activeTab === "checkout" ? t("checkinCheckedInRoom") : t("checkinReservation") })}</span>
                <button
                  type="button"
                  onClick={() => handleSearchQuery(searchKeyword)}
                  className="text-xs text-primary-6000 hover:text-primary-700 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
                  <span>{t("receptionistRefresh")}</span>
                </button>
              </h3>

              <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-6">
                <div className="relative flex-grow">
                  <Input
                    placeholder={t("checkinSearchPlaceholder")}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 h-11 rounded-2xl"
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <ButtonPrimary type="submit" disabled={isSearching} className="px-5 h-11 rounded-2xl text-sm font-bold">
                  {t("bookingsSearch")}
                </ButtonPrimary>
              </form>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {isSearching && (
                  <div className="py-12 text-center text-neutral-500 text-sm">{t("checkinSearching")}</div>
                )}

                {!isSearching && searchResults.length === 0 && (
                  <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                    {t("checkinNoMatchingReservations", { type: activeTab === "checkout" ? t("bookingsStatusCheckedIn") : t("checkinArriving") })}
                  </div>
                )}

                {!isSearching &&
                  searchResults.map((item) => {
                    const isSelected = booking?.id === item.id;
                    const isInvalid =
                      activeTab === "checkin"
                        ? item.status !== "CONFIRMED" && item.status !== "PENDING"
                        : item.status !== "CHECKED_IN";

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectBooking(item)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? "border-primary-6000 bg-primary-50/60 dark:bg-primary-950/30 ring-2 ring-primary-500/20 shadow-sm"
                            : isInvalid
                            ? "border-neutral-200 dark:border-neutral-800 opacity-50 bg-neutral-50 dark:bg-neutral-800/40"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-neutral-800/80"
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                              {t("bookingsRoomNumber", { number: item.room?.room_number })} ({item.room?.room_type?.name})
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                              {t(`bookingsStatus${item.status === "CHECKED_IN" ? "CheckedIn" : item.status === "CHECKED_OUT" ? "CheckedOut" : item.status.charAt(0) + item.status.slice(1).toLowerCase()}`, { defaultValue: item.status })}
                            </span>
                          </div>

                          <div className="text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-3">
                            <span className="flex items-center gap-1 font-semibold truncate">
                              <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                              {item.user?.full_name || item.guest?.full_name || t("checkinUnknownGuest")}
                            </span>
                            {item.user?.phone && (
                              <span className="flex items-center gap-1 text-neutral-500 font-mono">
                                <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                {item.user.phone}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            <span>{item.check_in_date} &rarr; {item.check_out_date}</span>
                            <span className="font-bold text-neutral-700 dark:text-neutral-300 ml-1">
                              {formatMoney(item.total_amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 self-end sm:self-center">
                          {isSelected ? (
                            <span className="px-3 py-1 rounded-xl bg-primary-6000 text-white text-xs font-bold shadow-sm">
                              {t("checkinSelected")}
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                isInvalid
                                  ? "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500"
                                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"
                              }`}
                            >
                              {isInvalid ? t("checkinWrongStatus") : t("checkinSelect")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Walk-In Room Selection Step 1 */
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
              <h3 className="text-lg font-bold flex items-center justify-between text-neutral-900 dark:text-white">
                <span>{t("checkinStepPickDatesRoom")}</span>
                <button
                  type="button"
                  onClick={fetchAvailableRoomsForWalkIn}
                  className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t("checkinRefreshRooms")}
                </button>
              </h3>

              <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t("bookingsCheckIn")}</label>
                  <Input
                    type="date"
                    value={walkInDates.check_in}
                    onChange={(e) => {
                      setWalkInDates({ ...walkInDates, check_in: e.target.value });
                    }}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t("receptionistCheckOut")}</label>
                  <Input
                    type="date"
                    value={walkInDates.check_out}
                    onChange={(e) => {
                      setWalkInDates({ ...walkInDates, check_out: e.target.value });
                    }}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {availableRooms.length === 0 ? (
                  <div className="py-10 text-center text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                    {t("checkinNoVacantRooms")}
                  </div>
                ) : (
                  availableRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? "border-green-600 bg-green-50/60 dark:bg-green-950/30 ring-2 ring-green-500/20 shadow-sm"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-green-500 bg-white dark:bg-neutral-800/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-neutral-900 dark:text-white">
                              {t("bookingsRoomNumber", { number: room.room_number })}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                              {t("checkinVacant")}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mt-0.5">
                            {room.room_type?.name} &bull; {t("adminRoomsFloorValue", { floor: room.floor })}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-extrabold text-neutral-900 dark:text-white">
                            {formatMoney(room.room_type?.base_price || (room.room_type as any)?.base_price_per_night || 0)}
                          </div>
                          <div className="text-[10px] text-neutral-400">{t("listingPerNight")}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Panel: Step 3 Verification & Final Action */}
        <div className="lg:col-span-6 space-y-6">
          {/* Summary Card */}
          {activeTab !== "walkin" && booking ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-xl border border-neutral-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-52 h-52 bg-primary-6000/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <div className="flex items-start justify-between pb-5 border-b border-neutral-700/80 mb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
                    {activeTab === "checkout" ? t("checkinDepartureRecord") : t("checkinVerificationCard")}
                  </span>
                  <h4 className="text-3xl font-extrabold mt-1">{t("bookingsRoomNumber", { number: booking.room?.room_number })}</h4>
                  <p className="text-sm text-neutral-300 font-medium">{booking.room?.room_type?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusBadge(booking.status)}`}>
                  {t(`bookingsStatus${booking.status === "CHECKED_IN" ? "CheckedIn" : booking.status === "CHECKED_OUT" ? "CheckedOut" : booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}`, { defaultValue: booking.status })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                <div className="bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-700/60">
                  <span className="text-xs text-neutral-400 block mb-0.5">{t("receptionistCheckInDate")}</span>
                  <span className="font-bold text-white">{booking.check_in_date}</span>
                </div>
                <div className="bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-700/60">
                  <span className="text-xs text-neutral-400 block mb-0.5">{t("receptionistCheckOutDate")}</span>
                  <span className="font-bold text-white">{booking.check_out_date}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-sm bg-neutral-800/40 p-4.5 rounded-2xl border border-neutral-700/40 mb-5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t("checkinTotalNights")}:</span>
                  <span className="font-bold">{t("bookingDetailNights", { count: calculateNights(booking.check_in_date, booking.check_out_date) })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t("checkinPrimaryGuest")}:</span>
                  <span className="font-bold text-primary-300">{booking.user?.full_name || booking.guest?.full_name || t("bookingsGuest")}</span>
                </div>
                {activeTab === "checkout" ? (
                  loadingCheckout ? (
                    <div className="text-xs text-neutral-400 animate-pulse text-center py-2">
                      {t("checkinCalculatingBilling")}
                    </div>
                  ) : checkoutDetails ? (
                    <>
                      <div className="flex justify-between pt-2 border-t border-neutral-700/40">
                        <span className="text-neutral-400">{t("bookingDetailRoomCharge")}:</span>
                        <span className="font-bold">{formatMoney(checkoutDetails.room_charges)}</span>
                      </div>
                      {checkoutDetails.service_charges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-amber-400 font-semibold">{t("checkinFoodServiceOrders")}:</span>
                          <span className="font-bold text-amber-300">{formatMoney(checkoutDetails.service_charges_detail.total_service)}</span>
                        </div>
                      )}
                      {checkoutDetails.service_charges_detail?.orders?.length > 0 && (
                        <div className="pl-3 space-y-1 text-xs border-l border-amber-500/30 my-1">
                          {checkoutDetails.service_charges_detail.orders.map((ord: any) => {
                            let itemPrice = Number(ord.total_amount || 0);
                            let displayName = t("checkinServiceOrder");
                            try {
                              if (ord.notes && ord.notes.trim().startsWith("{")) {
                                const notesObj = JSON.parse(ord.notes);
                                if (notesObj.is_car_rental) {
                                  const pick = notesObj.pickup_date ? notesObj.pickup_date.split("T")[0] : "";
                                  const drop = notesObj.dropoff_date ? notesObj.dropoff_date.split("T")[0] : "";
                                  displayName = t("checkinCarRentalLine", { type: notesObj.car_type, pick, drop });
                                  itemPrice = itemPrice * 26320;
                                } else {
                                  displayName = notesObj.notes || t("checkinServiceOrder");
                                }
                              } else {
                                displayName = ord.notes?.replace(/\[[^\]]+\]/g, "").trim() || t("checkinServiceOrder");
                              }
                            } catch (e) {
                              displayName = ord.notes?.replace(/\[[^\]]+\]/g, "").trim() || t("checkinServiceOrder");
                            }
                            return (
                              <div key={ord.id} className="flex justify-between text-neutral-400">
                                <span>• {displayName}:</span>
                                <span>{formatMoney(itemPrice)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {checkoutDetails.incident_charges?.total_fine > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-400 font-semibold">{t("checkinIncidentFines")}:</span>
                          <span className="font-bold text-red-300">{formatMoney(checkoutDetails.incident_charges.total_fine)}</span>
                        </div>
                      )}
                      
                      {/* List incidents if any */}
                      {checkoutDetails.incident_charges?.incidents?.length > 0 && (
                        <div className="pl-3 space-y-1 text-xs border-l border-red-500/30 my-1">
                          {checkoutDetails.incident_charges.incidents.map((inc: any) => (
                            <div key={inc.id} className="flex justify-between text-neutral-400">
                              <span>• {inc.description || inc.incident_type || t("checkinIncident")}:</span>
                              <span>{formatMoney(inc.approved_charge || inc.estimated_charge || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between pt-2 border-t border-neutral-700/40">
                        <span className="text-neutral-400">{t("checkinSubtotalAllCharges")}:</span>
                        <span className="font-bold">{formatMoney(checkoutDetails.subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-neutral-400">{t("checkinVat", { rate: 2 })}:</span>
                        <span className="font-bold">{formatMoney(checkoutDetails.vat_amount)}</span>
                      </div>
                      
                      <div className="flex justify-between font-semibold">
                        <span className="text-neutral-400">{t("checkinTotalInvoice")}:</span>
                        <span className="font-bold">{formatMoney(checkoutDetails.subtotal + checkoutDetails.vat_amount)}</span>
                      </div>

                      <div className="flex justify-between pt-2 border-t border-neutral-700/40">
                        <span className="text-neutral-400">{t("checkinDepositPaid")}:</span>
                        <span className="font-bold text-green-400">-{formatMoney(checkoutDetails.deposit_paid)}</span>
                      </div>
                      
                      <div className="flex justify-between pt-2 border-t border-neutral-700/60 text-base font-extrabold">
                        <span className="text-primary-300">{t("checkinAmountDue")}:</span>
                        <span className="text-white">{formatMoney(checkoutDetails.grand_total)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between pt-2 border-t border-neutral-700/40">
                      <span className="text-neutral-400">{t("checkinTotalRoomCharge")}:</span>
                      <span className="font-extrabold text-white text-base">{formatMoney(booking.total_amount)}</span>
                    </div>
                  )
                ) : (
                  <div className="flex justify-between pt-2 border-t border-neutral-700/40">
                    <span className="text-neutral-400">{t("checkinTotalRoomCharge")}:</span>
                    <span className="font-extrabold text-white text-base">{formatMoney(booking.total_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "walkin" && selectedRoom ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-green-950 via-neutral-900 to-neutral-900 text-white shadow-xl border border-green-800/60 relative overflow-hidden">
              <div className="flex items-start justify-between pb-5 border-b border-neutral-700/80 mb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-400">{t("checkinWalkInCard")}</span>
                  <h4 className="text-3xl font-extrabold mt-1">{t("bookingsRoomNumber", { number: selectedRoom.room_number })}</h4>
                  <p className="text-sm text-neutral-300 font-medium">{selectedRoom.room_type?.name}</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-green-100 text-green-900">{t("checkinVacant")}</span>
              </div>
              <div className="space-y-2 text-sm bg-neutral-800/60 p-4 rounded-2xl border border-neutral-700/50">
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t("checkinStayDuration")}:</span>
                  <span className="font-bold">{walkInDates.check_in} &rarr; {walkInDates.check_out}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t("checkinRatePerNight")}:</span>
                  <span className="font-bold">{formatMoney(selectedRoom.room_type?.base_price || (selectedRoom.room_type as any)?.base_price_per_night || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-700/60">
                  <span className="text-neutral-300 font-bold">{t("checkinEstimatedTotal")}:</span>
                  <span className="font-extrabold text-green-400 text-base">
                    {formatMoney(calculateNights(walkInDates.check_in, walkInDates.check_out) * (selectedRoom.room_type?.base_price || (selectedRoom.room_type as any)?.base_price_per_night || 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-800 text-center text-neutral-500">
              <Home className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="font-bold text-base text-neutral-700 dark:text-neutral-300">{t("checkinNothingSelected")}</p>
              <p className="text-xs mt-1">{t("checkinSelectStepOneHelp")}</p>
            </div>
          )}

          {/* Action Step 3 Console */}
          <div className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-opacity ${(!booking && activeTab !== "walkin") || (!selectedRoom && activeTab === "walkin") ? "opacity-50 pointer-events-none" : ""}`}>
            {activeTab === "checkout" ? (
              /* CHECK-OUT & BILLING PANEL */
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  <span>{t("checkinStepSettlement")}</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t("bookingDetailChoosePaymentMethod")}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["CASH", "BANK_TRANSFER"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            setShowQR(false);
                          }}
                          className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                            paymentMethod === method
                              ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                              : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <span>{method === "CASH" ? `💵 ${t("bookingDetailPaymentCash")}` : `🏦 ${t("bookingDetailPaymentTransfer")}`}</span>
                        </button>
                      ))}
                    </div>

                    {paymentMethod === "BANK_TRANSFER" && booking && showQR && (
                      <div className="mt-5 p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center">
                        <span className="text-sm font-semibold mb-3 text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                          {t("checkinScanVietQR")}
                        </span>
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-neutral-200 relative overflow-hidden group">
                          <img
                            src={payosQRUrl && payosQRUrl.startsWith("http") ? payosQRUrl : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payosQRUrl || "")}`}
                            alt={t("checkinVietQRAlt")}
                            className="w-48 h-48 object-contain"
                          />
                          {/* Scanning Animation line */}
                          <div className="absolute left-0 right-0 h-0.5 bg-primary-500 opacity-60 animate-bounce top-0 group-hover:block"></div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-4 text-center px-4 leading-relaxed">
                          {t("checkinVietQRHelp")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">{t("checkinTransactionReference")}</label>
                    <Input
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder={t("checkinTransactionPlaceholder")}
                      className="h-11 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <ButtonPrimary
                    className="w-full h-12 text-base font-bold bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/25"
                    onClick={handleCheckoutClick}
                    loading={actionLoading}
                    disabled={actionLoading || !booking}
                  >
                    {paymentMethod === "BANK_TRANSFER" && !showQR 
                      ? t("checkinCreatePaymentQR")
                      : t("checkinConfirmCheckout")}
                  </ButtonPrimary>
                </div>
              </div>
            ) : (
              /* CHECK-IN & WALKIN FORM PANEL */
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-6000" />
                  <span>{t("checkinStepGuestIdentity")}</span>
                </h3>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">{t("accountPageName")}</span>
                    <Input
                      value={guestForm.full_name}
                      onChange={(e) => setGuestForm({ ...guestForm, full_name: e.target.value })}
                      className="mt-1.5 h-11 font-semibold"
                      placeholder={t("checkinGuestNamePlaceholder")}
                      required
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">{t("checkinIdCardNumber")}</span>
                      <Input
                        value={guestForm.id_card_number}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ""); // Remove all non-digits
                          setGuestForm({ ...guestForm, id_card_number: val });
                        }}
                        className="mt-1.5 h-11 font-mono"
                        placeholder={t("checkinIdPassportPlaceholder")}
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">{t("checkinIdType")}</span>
                      <select
                        value={guestForm.id_card_type}
                        onChange={(e) => setGuestForm({ ...guestForm, id_card_type: e.target.value })}
                        className="block w-full text-sm rounded-2xl border-neutral-200 focus:border-primary-300 bg-white dark:border-neutral-700 dark:bg-neutral-900 mt-1.5 h-11 font-medium px-3"
                      >
                        <option value="CCCD">{t("checkinNationalId")}</option>
                        <option value="PASSPORT">{t("checkinPassport")}</option>
                        <option value="DRIVERS_LICENSE">{t("checkinDriversLicense")}</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">{t("bookingDetailNationality")}</span>
                      <Input
                        value={guestForm.nationality}
                        onChange={(e) => setGuestForm({ ...guestForm, nationality: e.target.value })}
                        className="mt-1.5 h-11 font-medium"
                      />
                    </label>
                    <label className="block">
                      <span className="text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider">{t("accountPageAddress")}</span>
                      <Input
                        value={guestForm.address}
                        onChange={(e) => setGuestForm({ ...guestForm, address: e.target.value })}
                        className="mt-1.5 h-11 font-medium"
                        placeholder={t("checkinOptionalAddress")}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {activeTab === "walkin" ? (
                    <ButtonPrimary
                      className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25"
                      onClick={confirmWalkInCheckIn}
                      loading={actionLoading}
                      disabled={actionLoading || !selectedRoom}
                    >
                      🚀 {t("checkinCreateWalkInNow")}
                    </ButtonPrimary>
                  ) : (
                    <ButtonPrimary
                      className="w-full h-12 text-base font-bold shadow-lg shadow-primary-6000/25"
                      onClick={confirmCheckIn}
                      loading={actionLoading}
                      disabled={actionLoading || !booking}
                    >
                      {t("checkinConfirmAssignRoom")}
                    </ButtonPrimary>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div className="container py-20 text-center">{t("checkinConsoleLoading")}</div>}>
      <DashboardLayout>
        <CheckInContent />
      </DashboardLayout>
    </Suspense>
  );
}
