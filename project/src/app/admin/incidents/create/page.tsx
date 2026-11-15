import React from "react";
import IncidentForm from "@/components/incidents/IncidentForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function CreateIncidentPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <AdminPageHeader titleKey="adminIncidentsCreateTitle" descriptionKey="adminIncidentsCreateSubtitle" />

      {/* Gọi Component Form */}
      <IncidentForm />
    </div>
  );
}
