import React, { useEffect } from 'react';

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem', minHeight: 'calc(100vh - 200px)' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1e293b' }}>Privacy Policy</h1>
      
      <div style={{ color: '#475569', lineHeight: '1.8' }}>
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>1. Information We Collect</h3>
        <p style={{ marginBottom: '1.5rem' }}>We collect personal information when you register, including your name, email address, phone number, and Line ID. For hosts, we may collect business registration or tax details to verify property ownership.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>2. How We Use Your Information</h3>
        <p style={{ marginBottom: '1.5rem' }}>Your information is used to facilitate bookings, communicate important updates, verify host identities, and improve our platform's services. Your contact information is shared with guests only when a booking is confirmed.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>3. Data Security</h3>
        <p style={{ marginBottom: '1.5rem' }}>We implement strict security measures to protect your data. Information is stored securely using encrypted databases. We do not sell your personal data to third parties.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>4. User Rights</h3>
        <p style={{ marginBottom: '1.5rem' }}>You have the right to access, update, or delete your personal information at any time. You can manage this through your profile settings or by contacting our support team.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>5. Cookies</h3>
        <p style={{ marginBottom: '1.5rem' }}>We use cookies to improve user experience, remember your preferences, and analyze site traffic. You can disable cookies in your browser settings, though this may affect site functionality.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>6. Policy Updates</h3>
        <p style={{ marginBottom: '1.5rem' }}>We may update this Privacy Policy periodically. Users will be notified of significant changes via email or an in-app notification.</p>
      </div>
    </div>
  );
};
