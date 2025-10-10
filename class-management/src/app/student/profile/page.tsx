"use client";

import AdminProfilePage from '@/app/admin/profile/page';

// 复用同一组件逻辑（目前两端显示一致，后续如需定制可拆分）
export default function StudentProfilePage() {
  return <AdminProfilePage />;
}
