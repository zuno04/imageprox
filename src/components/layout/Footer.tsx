import { useTranslation } from "react-i18next"; // Import useTranslation

export function Footer() {
  const { t } = useTranslation(); // Initialize useTranslation
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 px-4 sm:px-6 border-t border-border mt-auto transition-colors duration-150 ease-in-out">
      <div className="container mx-auto text-center text-sm text-muted-foreground space-y-1">
        <p>{t("footer.copyright", { year: currentYear })}</p>
        <p>
          <a
            href="mailto:emaga87@gmail.com?subject=ImageProx App Feedback"
            className="hover:text-primary hover:underline transition-colors"
          >
            {t("footer.sendFeedback")}
          </a>
        </p>
        <p>
          <a
            href="https://github.com/zuno04/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary hover:underline transition-colors"
          >
            {t("footer.githubProfile")}
          </a>
        </p>
      </div>
    </footer>
  );
}
