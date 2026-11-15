"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RoomIncident } from '@/types/incident';
import { DEFAULT_LANGUAGE, isAppLanguage, toFormattingLocale } from '@/lib/locale';

interface IncidentTableProps {
  incidents: RoomIncident[];
}

export default function IncidentTable({ incidents }: IncidentTableProps) {
  const { t, i18n } = useTranslation();
  const language = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const formattingLocale = toFormattingLocale(language);
  const getTypeLabel = (type: string) => t(`adminIncidentType${type}`, { defaultValue: type });
  const getSeverityLabel = (severity: string) => t(`adminIncidentSeverity${severity}`, { defaultValue: severity });
  const getStatusLabel = (status: string) => t(`adminIncidentStatus${status}`, { defaultValue: status });
  if (!incidents || incidents.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">{t("adminIncidentsEmpty")}</p>
      </div>
    );
  }

  // Helpers to get colors and labels
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-500/10 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLOSED':
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-850 dark:text-gray-400';
      case 'REPORTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400';
    }
  };

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6">{t("adminIncidentsColumnId")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminIncidentsColumnType")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminIncidentsColumnRoom")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminIncidentsColumnSeverity")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminIncidentsColumnStatus")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminIncidentsColumnCost")}</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">{t("adminIncidentsColumnTime")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6">
                {incident.incident_code}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {getTypeLabel(incident.incident_type)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {incident.room_id.slice(0, 8)}...
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getSeverityBadge(incident.severity)}`}>
                  {getSeverityLabel(incident.severity)}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBadge(incident.status)}`}>
                  {getStatusLabel(incident.status)}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                {incident.is_chargeable ? (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {new Intl.NumberFormat(formattingLocale, { style: 'currency', currency: 'VND' }).format(incident.estimated_charge)}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">{t("adminIncidentsNoCharge")}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {new Date(incident.created_at).toLocaleString(formattingLocale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
