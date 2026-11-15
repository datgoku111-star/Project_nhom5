"use client";

import React from "react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import { useTranslation } from "react-i18next";

const AccountBilling = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADING */}
      <h2 className="text-3xl font-semibold">{t("accountBillingTitle")}</h2>
      <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
      <div className="max-w-2xl">
        <span className="text-xl font-semibold block">{t("accountBillingMethods")}</span>
        <br />
        <span className="text-neutral-700 dark:text-neutral-300 block">
          {t("accountBillingDescription")}
          <br />
          <br />
          {t("accountBillingSetupHelp")}
        </span>
        <div className="pt-10">
          <ButtonPrimary>{t("accountBillingAddMethod")}</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

export default AccountBilling;
