import React from "react";
import LostFoundForm from "@/components/lost-found/LostFoundForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function CreateLostFoundPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <AdminPageHeader titleKey="adminLostFoundCreateTitle" descriptionKey="adminLostFoundCreateSubtitle" />

      {/* Tích hợp Form */}
      <LostFoundForm />
    </div>
  );
}
