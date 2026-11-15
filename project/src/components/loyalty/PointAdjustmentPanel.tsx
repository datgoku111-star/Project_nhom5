"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function PointAdjustmentPanel({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const type = formData.get('transaction_type') as 'EARNED' | 'REDEEMED';
    const pointsRaw = parseInt(formData.get('points') as string) || 0;
    const reason = formData.get('reason') as string;

    // Quy đổi số điểm: Nếu là REDEEMED (tiêu điểm) thì tự động chuyển thành số âm
    const points_changed = type === 'REDEEMED' ? -pointsRaw : pointsRaw;

    try {
      const res = await fetch('/api/custumers/points-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          transaction_type: type,
          points_changed,
          reason,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || t('adminCustomersPointsError'));
        return;
      }

      setSuccess(t('adminCustomersPointsSuccess'));
      e.currentTarget.reset(); // Xóa sạch form
      
      // Làm mới dữ liệu trên trang chi tiết để thấy Timeline cập nhật ngay
      router.refresh();
    } catch (err) {
      setError(t('adminCustomersConnectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5 mt-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t('adminCustomersPointsPanelTitle')}
      </h3>

      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
      {success && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">{success}</div>}

      <form onSubmit={handleAdjustment} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Loại tác vụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('adminCustomersActionField')}</label>
            <select
              name="transaction_type"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            >
              <option value="EARNED">{t('adminCustomersEarnPoints')}</option>
              <option value="REDEEMED">{t('adminCustomersRedeemPoints')}</option>
            </select>
          </div>

          {/* Số lượng điểm */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('adminCustomersPointsField')}</label>
            <input
              name="points"
              type="number"
              min="1"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
              placeholder={t('adminCustomersPointsPlaceholder')}
            />
          </div>
        </div>

        {/* Lý do thay đổi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('adminCustomersReasonField')} *</label>
          <input
            name="reason"
            type="text"
            required
            minLength={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 sm:text-sm"
            placeholder={t('adminCustomersReasonPlaceholder')}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50 w-full sm:w-auto"
          >
            {loading ? t('adminCustomersProcessing') : t('adminCustomersConfirmAdjustment')}
          </button>
        </div>
      </form>
    </div>
  );
}
