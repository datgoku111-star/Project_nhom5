"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import type { DashboardStats } from "@/types/hotel";
import { BedDouble, Users, CreditCard, UtensilsCrossed, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isAppLanguage, toFormattingLocale } from "@/lib/locale";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);
  }, []);

  if (!stats) return <div className="p-8">{t("roleAdminLoadingStats")}</div>;

  const activeLanguage = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</h4>
        </div>
        <div className={`p-4 rounded-full ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("roleAdminOverviewTitle")}</h1>
        <p className="text-neutral-500 mt-1">{t("roleAdminWelcomeBack", { name: user?.full_name })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t("roleAdminTodayRevenue")}
          value={new Intl.NumberFormat(toFormattingLocale(activeLanguage), { style: "currency", currency: "VND" }).format(stats.revenue_today)}
          icon={CreditCard}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard 
          title={t("roleAdminOccupancyRate")}
          value={`${stats.occupancy_rate}%`}
          icon={TrendingUp}
          colorClass="bg-primary-100 text-primary-6000"
        />
        <StatCard 
          title={t("roleAdminPendingOrders")}
          value={stats.pending_orders}
          icon={UtensilsCrossed}
          colorClass="bg-amber-100 text-amber-600"
        />
        <StatCard 
          title={t("roleAdminAvailableRooms")}
          value={`${stats.available_rooms} / ${stats.total_rooms}`}
          icon={BedDouble}
          colorClass="bg-blue-100 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">{t("roleAdminFrontDeskToday")}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-blue-500" />
                <span className="font-medium">{t("roleAdminExpectedArrivals")}</span>
              </div>
              <span className="text-xl font-bold">{stats.todays_arrivals}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-amber-500" />
                <span className="font-medium">{t("roleAdminExpectedDepartures")}</span>
              </div>
              <span className="text-xl font-bold">{stats.todays_departures}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">{t("roleAdminQuickActions")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/rooms" className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors">{t("roleAdminManageRooms")}</Link>
            <Link href="/admin/services" className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors">{t("roleAdminManageServices")}</Link>
            <Link href="/admin/users" className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors">{t("roleAdminUserAccess")}</Link>
            <Link href="/admin/reports" className="p-4 bg-primary-50 text-primary-700 rounded-xl font-medium hover:bg-primary-100 transition-colors">{t("roleAdminFullReports")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
