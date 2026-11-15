import React from 'react';
import { supabaseServer as supabase } from '@/lib/supabase';
import IncidentTable from '@/components/incidents/IncidentTable';
import { RoomIncident } from '@/types/incident';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

// Đảm bảo trang luôn lấy dữ liệu mới nhất, không bị cache
export const revalidate = 0; 

export default async function IncidentsPage() {
  // Lấy dữ liệu từ database (Có thể thêm try/catch nếu muốn xử lý lỗi strict hơn)
  const { data, error } = await supabase
    .from('room_incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi khi fetch incidents:', error);
  }

  const incidents = (data || []) as RoomIncident[];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <AdminPageHeader titleKey="adminIncidentsTitle" descriptionKey="adminIncidentsSubtitle" actionKey="adminIncidentsAdd" actionHref="/admin/incidents/create" />

      {/* Tích hợp component Table */}
      <IncidentTable incidents={incidents} />
    </div>
  );
}
