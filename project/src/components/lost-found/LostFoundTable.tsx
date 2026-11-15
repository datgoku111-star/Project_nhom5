"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LostFoundItem } from '@/types/lost-found';
import { Route } from '@/routers/types';

interface LostFoundTableProps {
  items: LostFoundItem[];
}

export default function LostFoundTable({ items }: LostFoundTableProps) {
  const { t } = useTranslation();
  const getStatusLabel = (status: string) => t(`adminLostFoundStatus${status}`, { defaultValue: status });
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">{t("adminLostFoundEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6">{t("adminLostFoundColumnId")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminLostFoundColumnName")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminLostFoundColumnFoundAt")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminLostFoundColumnStorage")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminLostFoundColumnStatus")}</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">{t("adminLostFoundColumnActions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6">
                {item.item_code}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                {item.item_name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                {item.where_found || t("adminLostFoundUnknown")}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                {item.storage_location || t("adminLostFoundNotStored")}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  item.status === 'RETURNED' ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400' :
                  item.status === 'STORED' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {getStatusLabel(item.status)}
                </span>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <a href={`/admin/lost-found/${item.id}` as Route} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                  {t("adminLostFoundDetails")}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
