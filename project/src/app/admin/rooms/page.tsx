"use client";

import React, { useState, useEffect } from "react";
import { BedDouble, Plus, Edit2, Trash2, RefreshCw, Tag, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import Input from "@/shared/Input";
import {
  DEFAULT_LANGUAGE,
  isAppLanguage,
  toFormattingLocale,
} from "@/lib/locale";

type RoomStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "DIRTY"
  | "CLEANING"
  | "MAINTENANCE";

const ROOM_STATUSES: RoomStatus[] = [
  "AVAILABLE",
  "IN_USE",
  "DIRTY",
  "CLEANING",
  "MAINTENANCE",
];

const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  AVAILABLE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  IN_USE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  DIRTY:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  CLEANING:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  MAINTENANCE:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export interface RoomTypeData {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  images: string[];
}

export interface RoomData {
  id: string;
  room_number: string;
  floor: number;
  room_type_id: string;
  status: RoomStatus;
  notes?: string;
  room_type?: RoomTypeData;
}

export default function AdminRoomsPage() {
  const { t, i18n } = useTranslation();
  const language = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;
  const formattingLocale = toFormattingLocale(language);
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(formattingLocale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  const getStatusLabel = (status: RoomStatus) => {
    switch (status) {
      case "AVAILABLE":
        return t("adminRoomsStatusAvailable");
      case "IN_USE":
        return t("adminRoomsStatusInUse");
      case "DIRTY":
        return t("adminRoomsStatusDirty");
      case "CLEANING":
        return t("adminRoomsStatusCleaning");
      case "MAINTENANCE":
        return t("adminRoomsStatusMaintenance");
    }
  };
  const getVisibleNote = (note?: string) => {
    if (!note) return null;
    return /(?:^|\|)\s*DAMAGE\s*:/i.test(note)
      ? t("adminRoomsDamageReportRecorded")
      : note;
  };

  const [activeTab, setActiveTab] = useState<"ROOMS" | "TYPES">("ROOMS");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Room
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [roomForm, setRoomForm] = useState({
    room_number: "",
    floor: 1,
    room_type_id: "",
    status: "AVAILABLE" as RoomData["status"],
    notes: "",
  });

  // Modal Room Type
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomTypeData | null>(null);
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    base_price: 1500000,
    max_occupancy: 2,
    amenitiesInput: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        fetch("/api/rooms?all=true"),
        fetch("/api/room-types"),
      ]);

      let loadedTypes: RoomTypeData[] = [];
      if (typesRes.ok) {
        const tData = await typesRes.json();
        if (Array.isArray(tData) && tData.length > 0) loadedTypes = tData;
      }
      if (loadedTypes.length === 0) {
        loadedTypes = [
          { id: "rt-1", name: "Deluxe Ocean View", base_price: 1500000, max_occupancy: 2, amenities: ["Wi-Fi", "Smart TV", "Minibar"], images: [] },
          { id: "rt-2", name: "Suite Premium King", base_price: 2800000, max_occupancy: 4, amenities: ["Wi-Fi", "Smart TV", "Jacuzzi"], images: [] },
          { id: "rt-3", name: "Standard Garden", base_price: 950000, max_occupancy: 2, amenities: ["Wi-Fi"], images: [] },
        ];
      }
      setRoomTypes(loadedTypes);

      let loadedRooms: RoomData[] = [];
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        if (Array.isArray(rData) && rData.length > 0) loadedRooms = rData;
      }
      if (loadedRooms.length === 0) {
        loadedRooms = [
          { id: "rm-101", room_number: "P101", floor: 1, room_type_id: loadedTypes[0].id, status: "AVAILABLE", room_type: loadedTypes[0] },
          { id: "rm-102", room_number: "P102", floor: 1, room_type_id: loadedTypes[2].id, status: "AVAILABLE", room_type: loadedTypes[2] },
          { id: "rm-201", room_number: "P201", floor: 2, room_type_id: loadedTypes[1].id, status: "IN_USE", room_type: loadedTypes[1] },
          { id: "rm-202", room_number: "P202", floor: 2, room_type_id: loadedTypes[0].id, status: "DIRTY", room_type: loadedTypes[0] },
          { id: "rm-301", room_number: "VIP_01", floor: 3, room_type_id: loadedTypes[1].id, status: "MAINTENANCE", room_type: loadedTypes[1] },
        ];
      }
      setRooms(loadedRooms);
    } catch (err) {
      console.error("Fetch rooms/types error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Room Form Handlers
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      room_number: "",
      floor: 1,
      room_type_id: roomTypes[0]?.id || "",
      status: "AVAILABLE",
      notes: "",
    });
    setIsRoomModalOpen(true);
  };

  const openEditRoom = (room: RoomData) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      floor: room.floor,
      room_type_id: room.room_type_id || roomTypes[0]?.id || "",
      status: room.status,
      notes: room.notes || "",
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.room_number.trim() || !roomForm.room_type_id) {
      alert(t("adminRoomsRoomValidation"));
      return;
    }

    try {
      const selectedType = roomTypes.find((t) => t.id === roomForm.room_type_id);
      if (editingRoom) {
        if (editingRoom.id.startsWith("rm-")) {
          setRooms((prev) =>
            prev.map((r) => (r.id === editingRoom.id ? { ...r, ...roomForm, room_type: selectedType } : r))
          );
        } else {
          const res = await fetch("/api/rooms", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingRoom.id, ...roomForm }),
          });
          if (!res.ok) throw new Error(t("adminRoomsUpdateRoomError"));
          await fetchData();
        }
      } else {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomForm),
        });
        if (!res.ok) {
          const newRm: RoomData = {
            id: "rm-" + Math.random().toString(36).substring(2, 9),
            ...roomForm,
            room_type: selectedType,
          };
          setRooms((prev) => [newRm, ...prev]);
        } else {
          await fetchData();
        }
      }
      setIsRoomModalOpen(false);
    } catch (err: any) {
      alert(t("adminRoomsGenericError", { message: err.message }));
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm(t("adminRoomsConfirmDeleteRoom"))) return;
    try {
      if (id.startsWith("rm-")) {
        setRooms((prev) => prev.filter((r) => r.id !== id));
      } else {
        const res = await fetch(`/api/rooms?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(t("adminRoomsDeleteRoomError"));
        setRooms((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err: any) {
      alert(t("adminRoomsDeleteRoomErrorWithMessage", { message: err.message }));
    }
  };

  // Room Type Form Handlers
  const openAddType = () => {
    setEditingType(null);
    setTypeForm({
      name: "",
      description: "",
      base_price: 1500000,
      max_occupancy: 2,
      amenitiesInput: "",
    });
    setIsTypeModalOpen(true);
  };

  const openEditType = (type: RoomTypeData) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      description: type.description || "",
      base_price: type.base_price,
      max_occupancy: type.max_occupancy,
      amenitiesInput: (type.amenities || []).join(", "),
    });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim() || typeForm.base_price <= 0) {
      alert(t("adminRoomsTypeValidation"));
      return;
    }

    const amenities = typeForm.amenitiesInput.split(",").map((a) => a.trim()).filter(Boolean);

    try {
      if (editingType) {
        if (editingType.id.startsWith("rt-")) {
          setRoomTypes((prev) =>
            prev.map((t) => (t.id === editingType.id ? { ...t, ...typeForm, amenities } : t))
          );
        } else {
          const res = await fetch("/api/room-types", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingType.id, ...typeForm, amenities }),
          });
          if (!res.ok) throw new Error(t("adminRoomsUpdateTypeError"));
          await fetchData();
        }
      } else {
        const res = await fetch("/api/room-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...typeForm, amenities }),
        });
        if (!res.ok) {
          const newType: RoomTypeData = {
            id: "rt-" + Math.random().toString(36).substring(2, 9),
            ...typeForm,
            amenities,
            images: [],
          };
          setRoomTypes((prev) => [newType, ...prev]);
        } else {
          await fetchData();
        }
      }
      setIsTypeModalOpen(false);
    } catch (err: any) {
      alert(t("adminRoomsGenericError", { message: err.message }));
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm(t("adminRoomsConfirmDeleteType"))) return;
    try {
      if (id.startsWith("rt-")) {
        setRoomTypes((prev) => prev.filter((t) => t.id !== id));
      } else {
        const res = await fetch(`/api/room-types?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(t("adminRoomsDeleteTypeError"));
        setRoomTypes((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err: any) {
      alert(t("adminRoomsDeleteTypeErrorWithMessage", { message: err.message }));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-50 dark:bg-neutral-900 min-h-screen rounded-2xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
            <BedDouble className="w-8 h-8 text-primary-600" />
            {t("adminRoomsTitle")}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {t("adminRoomsSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ButtonThird onClick={fetchData} sizeClass="px-4 py-2.5">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("adminRoomsRefresh")}
          </ButtonThird>
          {activeTab === "ROOMS" ? (
            <ButtonPrimary onClick={openAddRoom} sizeClass="px-5 py-2.5">
              <Plus className="w-5 h-5 mr-1.5" />
              {t("adminRoomsAddRoom")}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary onClick={openAddType} sizeClass="px-5 py-2.5">
              <Plus className="w-5 h-5 mr-1.5" />
              {t("adminRoomsAddType")}
            </ButtonPrimary>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-700 pb-3">
        <button
          onClick={() => setActiveTab("ROOMS")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === "ROOMS"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
              : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Home className="w-4 h-4" />
          {t("adminRoomsRoomsTab", { count: rooms.length })}
        </button>
        <button
          onClick={() => setActiveTab("TYPES")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === "TYPES"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
              : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Tag className="w-4 h-4" />
          {t("adminRoomsTypesTab", { count: roomTypes.length })}
        </button>
      </div>

      {/* TAB 1: ROOMS INVENTORY TABLE */}
      {activeTab === "ROOMS" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-neutral-500">{t("adminRoomsLoading")}</div>
          ) : rooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">{t("adminRoomsEmpty")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 font-semibold text-sm">
                    <th className="py-4 px-6">{t("adminRoomsColumnRoom")}</th>
                    <th className="py-4 px-6">{t("adminRoomsColumnFloor")}</th>
                    <th className="py-4 px-6">{t("adminRoomsColumnType")}</th>
                    <th className="py-4 px-6">{t("adminRoomsColumnPrice")}</th>
                    <th className="py-4 px-6">{t("adminRoomsColumnStatus")}</th>
                    <th className="py-4 px-6 text-right">{t("adminRoomsColumnActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-sm">
                  {rooms.map((room) => {
                    const visibleNote = getVisibleNote(room.notes);
                    return (
                      <tr key={room.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                        <td className="py-4 px-6 font-extrabold text-neutral-900 dark:text-white text-base">
                          {t("adminRoomsRoomValue", { number: room.room_number })}
                        </td>
                        <td className="py-4 px-6 font-semibold">
                          {t("adminRoomsFloorValue", { floor: room.floor })}
                        </td>
                        <td className="py-4 px-6 font-bold text-primary-600 dark:text-primary-400">
                          {room.room_type?.name || t("adminRoomsDefaultType")}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-neutral-900 dark:text-white">
                          {t("adminRoomsPricePerNight", {
                            price: formatPrice(room.room_type?.base_price || 1500000),
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1.5 rounded-xl font-bold text-xs ${ROOM_STATUS_COLORS[room.status]}`}>
                            {getStatusLabel(room.status)}
                          </span>
                          {visibleNote && <div className="text-xs text-neutral-400 mt-1">{visibleNote}</div>}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => openEditRoom(room)}
                            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200"
                            title={t("adminRoomsEdit")}
                            aria-label={t("adminRoomsEdit")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                            title={t("adminRoomsDelete")}
                            aria-label={t("adminRoomsDelete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROOM TYPES & PRICING TABLE */}
      {activeTab === "TYPES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((type) => (
            <div key={type.id} className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">{type.name}</h3>
                  <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 font-bold px-3 py-1 rounded-full text-xs">
                    {t("adminRoomsMaxGuests", { count: type.max_occupancy })}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {type.description || t("adminRoomsDefaultDescription")}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(type.amenities || []).map((am, i) => (
                    <span key={i} className="bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400">{t("adminRoomsBasePrice")}</span>
                  <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                    {formatPrice(type.base_price)} <span className="text-xs font-normal text-neutral-500">{t("adminRoomsPerNight")}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditType(type)}
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200"
                    title={t("adminRoomsEdit")}
                    aria-label={t("adminRoomsEdit")}
                  >
                    <Edit2 className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600"
                    title={t("adminRoomsDelete")}
                    aria-label={t("adminRoomsDelete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Room */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-neutral-100 dark:border-neutral-700 space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {editingRoom ? t("adminRoomsEditRoomTitle") : t("adminRoomsAddRoomTitle")}
            </h3>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t("adminRoomsRoomNumberField")} *</label>
                  <Input
                    required
                    placeholder="P101, VIP01..."
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t("adminRoomsFloorField")} *</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{t("adminRoomsTypeField")} *</label>
                <select
                  value={roomForm.room_type_id}
                  onChange={(e) => setRoomForm({ ...roomForm, room_type_id: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm font-semibold outline-none"
                >
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {formatPrice(t.base_price)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{t("adminRoomsInitialStatusField")}</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as RoomStatus })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm font-semibold outline-none"
                >
                  {ROOM_STATUSES.map((status) => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{t("adminRoomsNotesField")}</label>
                <textarea
                  rows={2}
                  placeholder={t("adminRoomsNotesPlaceholder")}
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <ButtonThird type="button" onClick={() => setIsRoomModalOpen(false)}>{t("adminRoomsCancel")}</ButtonThird>
                <ButtonPrimary type="submit">{t("adminRoomsSaveRoom")}</ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Room Type */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-neutral-100 dark:border-neutral-700 space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {editingType ? t("adminRoomsEditTypeTitle") : t("adminRoomsAddTypeTitle")}
            </h3>

            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">{t("adminRoomsTypeNameField")} *</label>
                <Input
                  required
                  placeholder="Deluxe Ocean, Suite Premium King..."
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t("adminRoomsNightlyRateField")} *</label>
                  <Input
                    required
                    type="number"
                    min={100000}
                    step={50000}
                    value={typeForm.base_price}
                    onChange={(e) => setTypeForm({ ...typeForm, base_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t("adminRoomsMaxOccupancyField")} *</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={15}
                    value={typeForm.max_occupancy}
                    onChange={(e) => setTypeForm({ ...typeForm, max_occupancy: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{t("adminRoomsAmenitiesField")} *</label>
                <Input
                  required
                  placeholder={t("adminRoomsAmenitiesPlaceholder")}
                  value={typeForm.amenitiesInput}
                  onChange={(e) => setTypeForm({ ...typeForm, amenitiesInput: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{t("adminRoomsDescriptionField")}</label>
                <textarea
                  rows={2}
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <ButtonThird type="button" onClick={() => setIsTypeModalOpen(false)}>{t("adminRoomsCancel")}</ButtonThird>
                <ButtonPrimary type="submit">{t("adminRoomsSaveType")}</ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
