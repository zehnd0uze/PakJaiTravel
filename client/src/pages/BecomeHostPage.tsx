import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { ClaimPropertyModal } from '../components/ClaimPropertyModal';
import './BecomeHostPage.css';

const BecomeHostPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleGetStarted = async () => {
    setError('');
    if (!user) {
      navigate('/login?redirect=/become-host');
      return;
    }
    try {
      navigate('/dashboard?new=true');
    } catch (err: any) {
      setError(err.message || t('auth.errGeneric'));
    }
  };

  return (
    <div className="become-host-page animate-fade-in">
      <section className="bh-hero">
        <div className="container bh-hero-content">
          <span className="bh-overline">{t('becomeHost.overline')}</span>
          <h1>{t('becomeHost.titleLine1')} <br/><span>{t('becomeHost.titleLine2')}</span></h1>
          <p className="bh-lead">{t('becomeHost.lead')}</p>

          {error && <div className="bh-error">{error}</div>}

          <div className="bh-cta-wrapper">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              className="bh-main-cta"
            >
              {!user
                ? t('becomeHost.ctaGuest')
                : user.role === 'host'
                  ? t('becomeHost.ctaHost')
                  : t('becomeHost.ctaActivate')}
            </Button>

            <button
              type="button"
              className="bh-secondary-link"
              onClick={() => setShowClaimModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1.5px solid #2e7d32',
                borderRadius: '12px',
                color: '#2e7d32',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              {t('becomeHost.claimExisting')}
            </button>

            {user && user.role === 'host' && (
              <button className="bh-secondary-link" onClick={() => navigate('/dashboard')}>
                {t('becomeHost.viewListings')}
              </button>
            )}
          </div>

          <div className="bh-badges">
            <div className="bh-badge-item">
              <span>{t('becomeHost.badgeFee')}</span>
            </div>
            <div className="bh-badge-item">
              <span>{t('becomeHost.badgeDirect')}</span>
            </div>
            <div className="bh-badge-item">
              <span>{t('becomeHost.badgeVerified')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bh-steps container">
        <div className="bh-step-card">
          <div className="step-num">01</div>
          <h3>{t('becomeHost.step1Title')}</h3>
          <p>{t('becomeHost.step1Desc')}</p>
        </div>
        <div className="bh-step-card">
          <div className="step-num">02</div>
          <h3>{t('becomeHost.step2Title')}</h3>
          <p>{t('becomeHost.step2Desc')}</p>
        </div>
        <div className="bh-step-card">
          <div className="step-num">03</div>
          <h3>{t('becomeHost.step3Title')}</h3>
          <p>{t('becomeHost.step3Desc')}</p>
        </div>
      </section>

      <section className="bh-quote container glass-panel">
        <div className="quote-content">
          <blockquote>{t('becomeHost.quote')}</blockquote>
          <cite>{t('becomeHost.quoteAuthor')}</cite>
        </div>
      </section>

      <ClaimPropertyModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </div>
  );
};

export default BecomeHostPage;
