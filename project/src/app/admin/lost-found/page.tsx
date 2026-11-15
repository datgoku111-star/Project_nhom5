import React from 'react';
import { supabaseServer as supabase } from '@/lib/supabase';
import LostFoundTable from '@/components/lost-found/LostFoundTable';
import { LostFoundItem } from '@/types/lost-found';
import { Route } from '@/routers/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export const revalidate = 0; // Tắt cache

export default async function LostFoundPage() {
  const { data, error } = await supabase
    .from('lost_found_items')
    .select('*')
    .order('found_at', { ascending: false });

  if (error) {
    console.error('Lỗi khi fetch đồ thất lạc:', error);
  }

  const items = (data || []) as LostFoundItem[];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <AdminPageHeader titleKey="adminLostFoundTitle" descriptionKey="adminLostFoundSubtitle" actionKey="adminLostFoundAdd" actionHref="/admin/lost-found/create" />

      <LostFoundTable items={items} />
    </div>
  );
}
