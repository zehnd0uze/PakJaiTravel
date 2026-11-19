import React from 'react';
import { useTranslation } from 'react-i18next';
import './VerifiedBadge.css';

export const VerifiedBadge: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="verified-badge" title={t('verified.tooltip')}>
      <span className="verified-text">{t('verified.badge')}</span>
    </div>
  );
};
