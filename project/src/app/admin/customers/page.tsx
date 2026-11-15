import React from 'react';
import { supabaseServer as supabase } from '@/lib/supabase';
import CustomerTable from '@/components/loyalty/CustomerTable';
import { CustomerProfile } from '@/types/customer-loyalty';
import { Route } from '@/routers/types';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export const revalidate = 0; // Đảm bảo dữ liệu điểm số luôn mới nhất khi reload

export default async function AdminCustomersPage() {
  // Lấy danh sách hồ sơ khách hàng từ database
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
  }

  const customers = (data || []) as CustomerProfile[];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <AdminPageHeader titleKey="adminCustomersTitle" descriptionKey="adminCustomersSubtitle" actionKey="adminCustomersAdd" actionHref="/admin/customers/create" />

      {/* Gọi component bảng dữ liệu */}
      <CustomerTable customers={customers} />
    </div>
  );
}
