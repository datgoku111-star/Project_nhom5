"use client";

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function IncidentDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/incidents/report').then(res => res.json()).then(data => setStats(data));
  }, []);

  if (!stats) return <div>{t('adminIncidentsStatsLoading')}</div>;

  const chartData = Object.entries(stats).map(([name, value]) => ({
    name: t(`adminIncidentType${name}`, { defaultValue: name }),
    value,
  }));
  const COLORS = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Biểu đồ */}
      <div className="bg-white p-6 rounded-lg shadow h-64">
        <h3 className="font-bold mb-4">{t('adminIncidentsStatsBreakdown')}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Card tổng số */}
      <div className="bg-indigo-600 p-6 rounded-lg shadow text-white flex flex-col justify-center">
        <h3 className="text-xl font-bold">{t('adminIncidentsStatsTotal')}</h3>
        <p className="text-5xl font-bold mt-2">
        {Object.values(stats as Record<string, number>).reduce((a, b) => a + b, 0)}
       </p>
      </div>
    </div>
  );
}
