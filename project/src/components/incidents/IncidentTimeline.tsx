"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, isAppLanguage, toFormattingLocale } from '@/lib/locale';

interface HistoryRecord {
  id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}

export default function IncidentTimeline({ history }: { history: HistoryRecord[] }) {
  const { t, i18n } = useTranslation();
  const language = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const formattingLocale = toFormattingLocale(language);

  const getStatusLabel = (status: string | null) => {
    if (!status) return t('adminCommonUnknown');
    const labels: Record<string, string> = {
      REPORTED: t('adminIncidentStatusREPORTED'),
      UNDER_REVIEW: t('adminIncidentStatusUNDER_REVIEW'),
      CUSTOMER_NOTIFIED: t('adminIncidentStatusCUSTOMER_NOTIFIED'),
      APPROVED_CHARGE: t('adminIncidentStatusAPPROVED_CHARGE'),
      ADDED_TO_INVOICE: t('adminIncidentStatusADDED_TO_INVOICE'),
      RESOLVED: t('adminIncidentStatusRESOLVED'),
      CLOSED: t('adminIncidentStatusCLOSED'),
      CANCELLED: t('adminIncidentStatusCANCELLED'),
    };
    return labels[status] ?? status;
  };

  if (!history || history.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">{t('adminIncidentsNoHistory')}</p>;
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {history.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {/* Vẽ đường gạch nối dọc */}
              {eventIdx !== history.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              ) : null}
              
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                    <span className="text-white text-xs font-bold">
                      {event.action === 'CREATED' ? '+' : '✓'}
                    </span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {event.action === 'CREATED' ? t('adminIncidentsHistoryCreated') : t('adminIncidentsHistoryChanged')}{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{getStatusLabel(event.new_status)}</span>
                    </p>
                    {event.note && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                        {event.note}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    <time dateTime={event.created_at}>
                      {new Date(event.created_at).toLocaleString(formattingLocale)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
