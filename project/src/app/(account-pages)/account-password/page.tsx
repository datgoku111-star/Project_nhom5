"use client";

import React from "react";
import Label from "@/components/Label";
import ButtonPrimary from "@/shared/ButtonPrimary";
import { useTranslation } from "react-i18next";
import Input from "@/shared/Input";

const AccountPass = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADING */}
      <h2 className="text-3xl font-semibold">{t("accountPasswordTitle")}</h2>
      <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
      <div className=" max-w-xl space-y-6">
        <div>
          <Label>{t("accountPasswordCurrent")}</Label>
          <Input type="password" className="mt-1.5" />
        </div>
        <div>
          <Label>{t("accountPasswordNew")}</Label>
          <Input type="password" className="mt-1.5" />
        </div>
        <div>
          <Label>{t("accountPasswordConfirm")}</Label>
          <Input type="password" className="mt-1.5" />
        </div>
        <div className="pt-2">
          <ButtonPrimary>{t("accountPasswordUpdate")}</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

export default AccountPass;
