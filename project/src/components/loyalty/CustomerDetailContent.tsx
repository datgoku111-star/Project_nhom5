"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isAppLanguage, toFormattingLocale } from "@/lib/locale";
import LoyaltyTimeline from "@/components/loyalty/LoyaltyTimeline";
import PointAdjustmentPanel from "@/components/loyalty/PointAdjustmentPanel";

interface CustomerProfile {
  id: string;
  full_name: string;
  membership_level: string;
  current_points: number;
  total_accumulated_points: number;
  total_spent: number;
  email: string | null;
  phone: string | null;
  preferences_notes: string | null;
}

interface PointsHistoryRecord {
  id: string;
  transaction_type: "EARNED" | "REDEEMED" | "REFUNDED";
  points_changed: number;
  reason: string | null;
  created_at: string;
}

export default function CustomerDetailContent({
  customer,
  history,
}: {
  customer: CustomerProfile;
  history: PointsHistoryRecord[];
}) {
  const { t, i18n } = useTranslation();
  const language = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const formattingLocale = toFormattingLocale(language);
  const membershipLabel = t(`adminCustomersMembership${customer.membership_level}`, {
    defaultValue: customer.membership_level,
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <div className="sm:flex sm:items-center sm:justify-between mb-4 border-b pb-4 border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("adminCustomersDetailTitle")}: <span className="text-indigo-600 dark:text-indigo-400">{customer.full_name}</span>
            </h1>
            <p className="text-sm text-gray-400 font-mono mt-1">ID: {customer.id}</p>
          </div>
          <span className="mt-2 sm:mt-0 inline-flex items-center rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-purple-900/40 dark:text-purple-300">
            {t("adminCustomersMembership")}: {membershipLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t("adminCustomersAvailablePoints")}</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{customer.current_points} P</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t("adminCustomersLifetimePoints")}</p>
            <p className="mt-2 text-2xl font-bold text-gray-700 dark:text-gray-300">{customer.total_accumulated_points} P</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t("adminCustomersTotalSpent")}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat(formattingLocale, { style: "currency", currency: "VND" }).format(customer.total_spent)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t("adminCustomersContact")}</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-300 truncate font-medium">{customer.email || "---"}</p>
            <p className="text-xs text-gray-400 font-mono">{customer.phone || "---"}</p>
          </div>

          <div className="sm:col-span-2 md:col-span-4">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t("adminCustomersPreferences")}</p>
            <p className="mt-2 text-sm text-gray-900 dark:text-gray-300 whitespace-pre-wrap bg-yellow-50/40 dark:bg-gray-900/20 p-4 rounded-md border border-yellow-100 dark:border-gray-700 italic">
              {customer.preferences_notes || t("adminCustomersNoPreferences")}
            </p>
          </div>
        </div>
      </div>

      <PointAdjustmentPanel customerId={customer.id} />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
          {t("adminCustomersPointsHistoryTitle")}
        </h2>
        <LoyaltyTimeline history={history} />
      </div>
    </div>
  );
}
