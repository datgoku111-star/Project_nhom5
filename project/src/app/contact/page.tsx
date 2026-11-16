"use client";

import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import SectionSubscribe2 from "@/components/SectionSubscribe2";
import SocialsList from "@/shared/SocialsList";
import Label from "@/components/Label";
import Input from "@/shared/Input";
import Textarea from "@/shared/Textarea";
import ButtonPrimary from "@/shared/ButtonPrimary";

export interface PageContactProps {}

const PageContact: FC<PageContactProps> = ({}) => {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const info = [
    {
      title: "🗺 " + t("contactAddressTitle"),
      desc: "Khu du lịch & Nghỉ dưỡng HSRM Resort, Bãi biển An Bàng, Hội An, Việt Nam",
    },
    {
      title: "💌 " + t("contactEmailTitle"),
      desc: "contact@hsrmresort.com",
    },
    {
      title: "☎ " + t("contactPhoneTitle"),
      desc: "000-123-456-7890",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Validation
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setStatus({
        type: "error",
        message: t("contactValidationError"),
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatus({
        type: "error",
        message: t("contactValidationError"),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("contactErrorMessage"));
      }

      setStatus({
        type: "success",
        message: t("contactSuccessMessage"),
      });

      // Clear form inputs
      setFullName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error("Submit contact form failed:", err);
      setStatus({
        type: "error",
        message: err?.message || t("contactErrorMessage"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`nc-PageContact overflow-hidden`}>
      <div className="mb-24 lg:mb-32">
        <h2 className="my-16 sm:my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
          {t("contactTitle")}
        </h2>
        <div className="container max-w-7xl mx-auto">
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-12 ">
            <div className="max-w-sm space-y-8">
              {info.map((item, index) => (
                <div key={index}>
                  <h3 className="uppercase font-semibold text-sm dark:text-neutral-200 tracking-wider">
                    {item.title}
                  </h3>
                  <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
                    {item.desc}
                  </span>
                </div>
              ))}
              <div>
                <h3 className="uppercase font-semibold text-sm dark:text-neutral-200 tracking-wider">
                  🌏 {t("contactSocialsTitle")}
                </h3>
                <SocialsList className="mt-2" />
              </div>
            </div>
            <div>
              {status && (
                <div
                  className={`mb-6 p-4 rounded-2xl flex items-start justify-between text-sm ${
                    status.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                      : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {status.type === "success" ? "✅" : "⚠️"}
                    </span>
                    <p className="leading-relaxed font-medium">{status.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatus(null)}
                    className="ml-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form
                className="grid grid-cols-1 gap-6"
                onSubmit={handleSubmit}
                noValidate
              >
                <label className="block">
                  <Label>
                    {t("contactFullName")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder={t("contactFullNamePlaceholder")}
                    type="text"
                    className="mt-1"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <Label>
                    {t("contactEmailAddress")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder={t("contactEmailPlaceholder")}
                    className="mt-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="block">
                    <Label>{t("contactPhone")}</Label>
                    <Input
                      type="tel"
                      placeholder={t("contactPhonePlaceholder")}
                      className="mt-1"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <Label>{t("contactSubject")}</Label>
                    <Input
                      type="text"
                      placeholder={t("contactSubjectPlaceholder")}
                      className="mt-1"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </label>
                </div>

                <label className="block">
                  <Label>
                    {t("contactMessage")} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    className="mt-1"
                    rows={6}
                    placeholder={t("contactMessagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </label>

                <div>
                  <ButtonPrimary
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("contactSending") : t("contactSendMessage")}
                  </ButtonPrimary>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* OTHER SECTIONS */}
      <div className="container">
        <SectionSubscribe2 className="pb-24 lg:pb-32" />
      </div>
    </div>
  );
};

export default PageContact;
