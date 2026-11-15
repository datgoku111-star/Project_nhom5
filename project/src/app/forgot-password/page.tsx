"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Input from "@/shared/Input";
import ButtonPrimary from "@/shared/ButtonPrimary";
import { supabaseBrowser } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } =
        await supabaseBrowser.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) throw resetError;
      setSent(true);
    } catch (requestError) {
      console.error("Password reset request failed:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("signupRegistrationError")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mb-24 lg:mb-32">
      <h1 className="my-20 text-center text-3xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-5xl">
        {t("forgotPasswordTitle")}
      </h1>
      <div className="mx-auto max-w-md space-y-6">
        <p className="text-center text-neutral-600 dark:text-neutral-300">
          {t("forgotPasswordDescription")}
        </p>
        {error && (
          <div role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950/35 dark:text-red-300">
            {error}
          </div>
        )}
        {sent ? (
          <div role="status" className="rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-950/35 dark:text-green-300">
            {t("forgotPasswordSent")}
          </div>
        ) : (
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t("loginEmailAddress")}
              </span>
              <Input
                type="email"
                autoComplete="email"
                className="mt-1"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <ButtonPrimary type="submit" loading={loading} disabled={loading}>
              {t("forgotPasswordSend")}
            </ButtonPrimary>
          </form>
        )}
        <Link href="/login" className="block text-center text-sm font-medium underline">
          {t("forgotPasswordBackToLogin")}
        </Link>
      </div>
    </div>
  );
}
