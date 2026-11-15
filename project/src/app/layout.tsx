import { Poppins } from "next/font/google";
import SiteHeader from "./(client-components)/(Header)/SiteHeader";
import ClientCommons from "./ClientCommons";
import "./globals.css";
import "@/fonts/line-awesome-1.3.0/css/line-awesome.css";
import "@/styles/index.scss";
import { cookies } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  isAppLanguage,
  toHtmlLanguage,
} from "@/lib/locale";
import "rc-slider/assets/index.css";
import Footer from "@/components/Footer";
import FooterNav from "@/components/FooterNav";
import { AuthProvider } from "@/lib/auth-context";
import I18nProvider from "@/components/I18nProvider";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const languageCookie = cookies().get("site-language")?.value;
  const initialLanguage = isAppLanguage(languageCookie)
    ? languageCookie
    : DEFAULT_LANGUAGE;

  return (
    <html lang={toHtmlLanguage(initialLanguage)} className={poppins.className}>
      <body className="bg-white text-base dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        <I18nProvider
          initialLanguage={initialLanguage}
          hasLanguageCookie={isAppLanguage(languageCookie)}
        >
          <AuthProvider>
            <ClientCommons />
            <SiteHeader />
            {children}
            <FooterNav />
            <Footer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
