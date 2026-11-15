"use client";

import React, { FC } from "react";
import { useTranslation } from "react-i18next";

export interface SaleOffBadgeProps {
  className?: string;
  desc?: string;
}

const SaleOffBadge: FC<SaleOffBadgeProps> = ({
  className = "",
  desc,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`nc-SaleOffBadge flex items-center justify-center text-xs py-0.5 px-3 bg-red-700 text-red-50 rounded-full ${className}`}
      data-nc-id="SaleOffBadge"
    >
      {desc || t("listingSaleToday")}
    </div>
  );
};

export default SaleOffBadge;
