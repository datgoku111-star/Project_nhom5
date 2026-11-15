"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Input from "@/shared/Input";
import ButtonPrimary from "@/shared/ButtonPrimary";
import { supabaseBrowser } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [checkingLink, setCheckingLink] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setValidLink(Boolean(session));
      }
    });

    const checkRecoverySession = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const linkError =
          query.get("error_description") || hash.get("error_description");

        if (linkError) {
          setError(linkError);
          return;
        }

        const { data, error: sessionError } =
          await supabaseBrowser.auth.getSession();
        if (sessionError) {
          setError(sessionError.message);
        }
        setValidLink(Boolean(data.session));
      } catch (sessionError) {
        console.error("Could not verify password reset link:", sessionError);
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : t("resetPasswordInvalidLink")
        );
      } finally {
        setCheckingLink(false);
      }
    };

    void checkRecoverySession();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("resetPasswordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("resetPasswordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setUpdated(true);
    } catch (updateError) {
      console.error("Password update failed:", updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : t("resetPasswordInvalidLink")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mb-24 lg:mb-32">
      <h1 className="my-20 text-center text-3xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-5xl">
        {t("resetPasswordTitle")}
      </h1>
      <div className="mx-auto max-w-md space-y-6">
        {checkingLink ? (
          <p role="status" className="text-center text-neutral-600 dark:text-neutral-300">
            {t("loading")}
          </p>
        ) : updated ? (
          <>
            <p role="status" className="rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-950/35 dark:text-green-300">
              {t("resetPasswordSuccess")}
            </p>
            <Link href="/login" className="block text-center font-medium underline">
              {t("resetPasswordContinue")}
            </Link>
          </>
        ) : !validLink ? (
          <>
            <p role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950/35 dark:text-red-300">
              {error || t("resetPasswordInvalidLink")}
            </p>
            <Link href="/forgot-password" className="block text-center font-medium underline">
              {t("forgotPasswordSend")}
            </Link>
          </>
        ) : (
          <form className="grid gap-6" onSubmit={handleSubmit}>
            {error && (
              <div role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950/35 dark:text-red-300">
                {error}
              </div>
            )}
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t("resetPasswordNewPassword")}
              </span>
              <Input
                type="password"
                autoComplete="new-password"
                className="mt-1"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t("resetPasswordConfirmPassword")}
              </span>
              <Input
                type="password"
                autoComplete="new-password"
                className="mt-1"
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
            <ButtonPrimary type="submit" loading={loading} disabled={loading}>
              {t("resetPasswordSubmit")}
            </ButtonPrimary>
          </form>
        )}
        {!updated && (
          <Link href="/login" className="block text-center text-sm font-medium underline">
            {t("forgotPasswordBackToLogin")}
          </Link>
        )}
      </div>
    </div>
  );
}
