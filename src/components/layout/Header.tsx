import { useTranslation } from 'react-i18next'; // Import useTranslation
import { ThemeToggle } from "../ui/ThemeToggle"; // Adjust path as needed
import LanguageSwitcher from '../LanguageSwitcher'; // Import the new component

export function Header() {
  const { t } = useTranslation(); // Initialize useTranslation

  return (
    <header className="py-4 px-4 sm:px-6 border-b border-border transition-colors duration-150 ease-in-out">
      {" "}
      {/* Added transition */}
      <div className="container mx-auto flex items-center justify-between gap-x-2">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">{t('header.title')}</h1>{" "}
        {/* Shorter Title Example */}
        <div className="flex items-center gap-x-2"> {/* Added a div to group ThemeToggle and LanguageSwitcher */}
          <ThemeToggle />
          <LanguageSwitcher /> {/* Add the component here */}
        </div>
      </div>
    </header>
  );
}
