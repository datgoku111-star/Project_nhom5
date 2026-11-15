"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";
import { Route } from "@/routers/types";
import { 
  Compass, LayoutDashboard, 
  BedDouble, 
  Users, 
  UtensilsCrossed, 
  SprayCan, 
  ClipboardList, 
  CreditCard,
  Settings,
  LogOut,
  CalendarCheck,
  CalendarDays,
  Car,
  Shirt
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();

  if (!user) return null; // Middleware handles redirect

  const navItems = [
    { key: "roleNavDashboard", href: `/dashboard/${user.role.toLowerCase()}`, icon: LayoutDashboard, roles: ["ADMIN", "RECEPTIONIST", "CUSTOMER"] },
    
    // Admin only
    { key: "roleNavAdminDashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
    { key: "roleNavHotelManagement", href: "/admin/hotels", icon: BedDouble, roles: ["ADMIN"] },
    { key: "roleNavRoomsTypes", href: "/admin/rooms", icon: BedDouble, roles: ["ADMIN"] },
    { key: "roleNavUserManagement", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { key: "roleNavServiceCatalog", href: "/admin/services", icon: UtensilsCrossed, roles: ["ADMIN"] },
    { key: "roleNavReports", href: "/admin/reports", icon: ClipboardList, roles: ["ADMIN"] },
    
    // Staff cross-functional
    { key: "roleNavCheckInOut", href: "/checkin", icon: CalendarCheck, roles: ["ADMIN", "RECEPTIONIST"] },
    { key: "roleNavAllBookings", href: "/bookings", icon: ClipboardList, roles: ["ADMIN", "RECEPTIONIST"] },
    { key: "roleNavServiceOrders", href: "/orders", icon: UtensilsCrossed, roles: ["ADMIN", "KITCHEN", "RECEPTIONIST"] },
    { key: "roleNavCarOrders", href: "/car-orders", icon: Car, roles: ["ADMIN", "RECEPTIONIST"] },
    { key: "roleNavExperienceOrders", href: "/experience-orders", icon: Compass, roles: ["ADMIN", "RECEPTIONIST"] },
    { key: "roleNavLaundryServices", href: "/laundry-orders", icon: Shirt, roles: ["ADMIN", "RECEPTIONIST", "HOUSEKEEPING"] },
    { key: "roleNavHousekeeping", href: "/housekeeping", icon: SprayCan, roles: ["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"] },
    
    // Customer
    { key: "roleNavMyBookings", href: "/bookings", icon: CalendarCheck, roles: ["CUSTOMER"] },
    { key: "roleNavBookedExperiences", href: "/booked-experiences", icon: Compass, roles: ["CUSTOMER"] },
    { key: "roleNavExperienceSchedule", href: "/experience-schedule", icon: CalendarDays, roles: ["CUSTOMER"] },
    { key: "roleNavOrderFoods", href: "/services", icon: UtensilsCrossed, roles: ["CUSTOMER"] },
    { key: "roleNavCarBookings", href: "/car-bookings", icon: Car, roles: ["CUSTOMER"] },
    { key: "roleNavLaundryServices", href: "/laundry-bookings", icon: Shirt, roles: ["CUSTOMER"] },
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary-6000">{t("roleWorkspaceTitle")}</h2>
          <p className="text-sm text-neutral-500 mt-1">{t("rolePortalLabel", { role: t(`userManagementRole${user.role.charAt(0)}${user.role.slice(1).toLowerCase()}`) })}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {allowedNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.key}
                href={item.href as Route}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive 
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" 
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-primary-6000" : "text-neutral-400"}`} />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <Link href={"/account" as Route} className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
            <Settings className="w-5 h-5 mr-3 text-neutral-400" />
            {t("roleNavSettings")}
          </Link>
          <button onClick={logout} className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-5 h-5 mr-3 text-red-500" />
            {t("roleNavLogout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
