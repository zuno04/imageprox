import { useTranslation } from "react-i18next"; // Import useTranslation

const GITHUB_URL = "https://github.com/zuno04";
const LINKEDIN_URL = "https://www.linkedin.com/in/alain-emaga/";
const PORTFOLIO_URL = "https://zunotech.link/";
const AUTHOR_NAME = "Emaga Alain";

export function Footer() {
  const { t } = useTranslation(); // Initialize useTranslation
  const currentYear = new Date().getFullYear();

  const linkClassName = "hover:text-primary hover:underline transition-colors";

  return (
    <footer className="py-6 px-4 sm:px-6 border-t border-border mt-auto transition-colors duration-150 ease-in-out">
      <div className="container mx-auto text-center text-sm text-muted-foreground space-y-1">
        <p>{t("footer.copyright", { year: currentYear })}</p>
        <p>
          <a
            href={`mailto:emaga87@gmail.com?subject=ImageProx App Feedback`}
            className={linkClassName}
          >
            {t("footer.sendFeedback")}
          </a>
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="me noopener noreferrer"
            className={linkClassName}
          >
            {t("footer.githubProfile")}
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="me noopener noreferrer"
            className={linkClassName}
          >
            {t("footer.linkedin")}
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="me noopener noreferrer"
            className={linkClassName}
          >
            {t("footer.portfolio")}
          </a>
        </p>
        <p className="text-xs">
          {t("footer.builtBy", { name: AUTHOR_NAME })}{" "}
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="me noopener noreferrer"
            className={linkClassName}
          >
            {AUTHOR_NAME}
          </a>
        </p>
      </div>
    </footer>
  );
}
