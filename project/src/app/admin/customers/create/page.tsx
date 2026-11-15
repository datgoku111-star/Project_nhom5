import React from "react";
import CustomerForm from "@/components/loyalty/CustomerForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function CreateCustomerPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <AdminPageHeader titleKey="adminCustomersCreateTitle" descriptionKey="adminCustomersCreateSubtitle" />

      <CustomerForm />
    </div>
  );
}
