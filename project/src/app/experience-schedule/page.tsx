"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import DashboardLayout from "../dashboard/layout";
import { Route } from "@/routers/types";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isAppLanguage, toFormattingLocale } from "@/lib/locale";

export default function ExperienceSchedulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const activeLanguage = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;
  const formattingLocale = toFormattingLocale(activeLanguage);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?callbackUrl=/experience-schedule" as Route);
      return;
    }

    if (user) {
      fetchExperiences();
    }
  }, [user, isLoading, router]);

  const fetchExperiences = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        const confirmedExps = data.filter((b: any) => {
          if (b.status !== "CONFIRMED") return false;
          try {
            const parsed = JSON.parse(b.special_requests);
            return parsed && parsed.isExperience === true;
          } catch (e) {
            return false;
          }
        });
        setExperiences(confirmedExps);
      }
    } catch (err) {
      console.error("Failed to fetch experiences", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(formattingLocale, { dateStyle: "medium" }).format(new Date(value));
  const formatMoney = (value: number) =>
    new Intl.NumberFormat(formattingLocale, { style: "currency", currency: "VND" }).format(value || 0);

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 lg:p-10 text-neutral-500">
          {t("experienceScheduleLoading")}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 space-y-6">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          {t("experienceScheduleTitle")}
        </h2>
        <p className="text-neutral-500">
          {t("experienceScheduleSubtitle")}
        </p>
        
        {experiences.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-neutral-500">{t("experienceScheduleEmpty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiences.map((exp) => {
              let title = t("experienceScheduleFallbackTitle");
              let roomNumber = exp.room?.room_number || exp.room_id;
              try {
                const parsed = JSON.parse(exp.special_requests);
                title = parsed.title || title;
                roomNumber = parsed.room_id || roomNumber;
              } catch(e) {}
              
              return (
                <div key={exp.id} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-emerald-600">{title}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {t("experienceScheduleConfirmed")}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <p><strong>{t("experienceScheduleStartDate")}:</strong> {formatDate(exp.check_in_date)}</p>
                    <p><strong>{t("experienceScheduleEndDate")}:</strong> {formatDate(exp.check_out_date)}</p>
                    <p><strong>{t("experienceScheduleLinkedRoom")}:</strong> {roomNumber || "—"}</p>
                    <p>
                      <strong>{t("experienceSchedulePaymentStatus")}:</strong>{" "}
                      {t("experienceSchedulePaidInFull", { amount: formatMoney(exp.total_amount) })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
