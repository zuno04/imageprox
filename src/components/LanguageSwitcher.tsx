import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'es', nativeName: 'Español' },
  { code: 'zh-CN', nativeName: '简体中文' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <div>
      <select value={i18n.resolvedLanguage} onChange={handleLanguageChange}>
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
