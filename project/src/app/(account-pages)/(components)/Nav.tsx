"use client";

import { Route } from "@/routers/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

export const Nav = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const listNav: { href: Route; label: string }[] = [
    { href: "/account", label: t("accountNavProfile") },
    { href: "/account-savelists", label: t("accountNavSavedLists") },
    { href: "/account-password", label: t("accountNavPassword") },
    { href: "/account-billing", label: t("accountNavBilling") },
  ];

  return (
    <div className="container">
      <div className="flex space-x-8 md:space-x-14 overflow-x-auto hiddenScrollbar">
        {listNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block py-5 md:py-8 border-b-2 flex-shrink-0 capitalize ${
                isActive
                  ? "border-primary-500 font-medium"
                  : "border-transparent"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
