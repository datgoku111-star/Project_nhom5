import { supabaseServer as supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import CustomerDetailContent from "@/components/loyalty/CustomerDetailContent";

export const revalidate = 0; // Tắt cache để điểm số luôn chuẩn xác theo thời gian thực

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // 1. Fetch thông tin hồ sơ chi tiết của khách hàng
  const { data: customer, error: customerError } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (customerError || !customer) {
    return notFound(); // Trả về trang 404 nếu mã ID UUID sai lệch hoặc không tồn tại
  }

  // 2. Fetch lịch sử biến động ví điểm (Mới nhất xếp trên cùng)
  const { data: history } = await supabase
    .from("loyalty_points_history")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return <CustomerDetailContent customer={customer} history={history || []} />;
}
