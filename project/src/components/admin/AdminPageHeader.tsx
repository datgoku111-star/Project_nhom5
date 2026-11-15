"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Route } from "@/routers/types";

interface AdminPageHeaderProps {
  titleKey: string;
  descriptionKey: string;
  actionKey?: string;
  actionHref?: string;
}

export default function AdminPageHeader({
  titleKey,
  descriptionKey,
  actionKey,
  actionHref,
}: AdminPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t(titleKey)}</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{t(descriptionKey)}</p>
      </div>
      {actionKey && actionHref && (
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href={actionHref as Route}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {t(actionKey)}
          </Link>
        </div>
      )}
    </div>
  );
}
