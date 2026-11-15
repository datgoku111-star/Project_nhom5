"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CompensationPanel({ incidentId }: { incidentId: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleApprove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      repair_cost: parseFloat(formData.get('repair_cost') as string) || 0,
      cleaning_fee: parseFloat(formData.get('cleaning_fee') as string) || 0,
      replacement_fee: parseFloat(formData.get('replacement_fee') as string) || 0,
      penalty_fee: parseFloat(formData.get('penalty_fee') as string) || 0,
      note: formData.get('note'),
    };

    await fetch(`/api/incidents/${incidentId}/compensation`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    window.location.reload();
  };

  return (
    <form onSubmit={handleApprove} className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
      <h3 className="font-bold mb-4">{t('adminIncidentsCompensationTitle')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <input name="repair_cost" type="number" placeholder={t('adminIncidentsRepairCost')} className="p-2 border rounded" />
        <input name="cleaning_fee" type="number" placeholder={t('adminIncidentsCleaningFee')} className="p-2 border rounded" />
        <input name="replacement_fee" type="number" placeholder={t('adminIncidentsReplacementFee')} className="p-2 border rounded" />
        <input name="penalty_fee" type="number" placeholder={t('adminIncidentsPenaltyFee')} className="p-2 border rounded" />
      </div>
      <button type="submit" disabled={loading} className="mt-4 w-full bg-green-600 text-white py-2 rounded">
        {loading ? t('adminIncidentsProcessing') : t('adminIncidentsApproveCompensation')}
      </button>
    </form>
  );
}
