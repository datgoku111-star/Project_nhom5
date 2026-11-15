"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CreateLostFoundSchema, CreateLostFoundInput } from "@/types/lost-found";
import { Route } from "@/routers/types";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";

export default function LostFoundForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLostFoundInput>({
    resolver: zodResolver(CreateLostFoundSchema),
    defaultValues: {
      estimated_value: 0,
    },
  });

  const onSubmit = async (data: CreateLostFoundInput) => {
    setSubmitError("");
    try {
      // Làm sạch dữ liệu rỗng (chuyển chuỗi rỗng thành null/undefined nếu cần)
      const payload = {
        ...data,
        room_id: data.room_id || null, // Tránh lỗi UUID không hợp lệ nếu để trống
      };

      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setSubmitError(errorData.error || t("adminLostFoundSaveError"));
        return;
      }

      // Về lại trang danh sách phù hợp
      if (user?.role === "ADMIN") {
        router.push("/admin/lost-found" as Route);
      } else {
        router.push("/bookings" as Route);
      }
      router.refresh();
    } catch (error) {
      setSubmitError(t("adminLostFoundConnectionError"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
      {submitError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Tên đồ vật */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("adminLostFoundNameField")} *</label>
          <input
            type="text"
            {...register("item_name")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder={t("adminLostFoundNamePlaceholder")}
          />
          {errors.item_name && <p className="mt-1 text-sm text-red-500">{t("adminLostFoundNameValidation")}</p>}
        </div>

        {/* Danh mục */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("adminLostFoundCategoryField")}</label>
          <input
            type="text"
            {...register("item_category")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder={t("adminLostFoundCategoryPlaceholder")}
          />
        </div>

        {/* Vị trí tìm thấy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("adminLostFoundFoundAtField")}</label>
          <input
            type="text"
            {...register("where_found")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder={t("adminLostFoundFoundAtPlaceholder")}
          />
        </div>

        {/* Nơi cất giữ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("adminLostFoundStorageField")}</label>
          <input
            type="text"
            {...register("storage_location")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder={t("adminLostFoundStoragePlaceholder")}
          />
        </div>

        {/* ID Phòng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("adminLostFoundRoomField")}</label>
          <input
            type="text"
            {...register("room_id")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder={t("adminLostFoundRoomPlaceholder")}
          />
          {errors.room_id && <p className="mt-1 text-sm text-red-500">{t("adminLostFoundRoomValidation")}</p>}
        </div>

        {/* Giá trị ước tính */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("adminLostFoundValueField")}</label>
          <input
            type="number"
            {...register("estimated_value", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
          />
          {errors.estimated_value && <p className="mt-1 text-sm text-red-500">{t("adminLostFoundValueValidation")}</p>}
        </div>
      </div>

      {/* Mô tả chi tiết */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("adminLostFoundDescriptionField")}</label>
        <textarea
          {...register("description")}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
          placeholder={t("adminLostFoundDescriptionPlaceholder")}
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.push("/admin/lost-found" as Route)}
          className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {t("adminLostFoundCancel")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? t("adminLostFoundProcessing") : t("adminLostFoundSave")}
        </button>
      </div>
    </form>
  );
}
