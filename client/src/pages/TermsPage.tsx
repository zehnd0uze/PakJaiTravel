import React, { useEffect } from 'react';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem', minHeight: 'calc(100vh - 200px)' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1e293b' }}>Terms of Service</h1>
      
      <div style={{ color: '#475569', lineHeight: '1.8' }}>
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>1. Acceptance of Terms</h3>
        <p style={{ marginBottom: '1.5rem' }}>By registering an account and listing a property on PakJai Travel, you agree to abide by these terms. We serve as a booking platform connecting travelers with hosts in Chiang Dao.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>2. Host Responsibilities</h3>
        <p style={{ marginBottom: '1.5rem' }}>You confirm that you are the legal owner or authorized manager of any property you list. All information provided, including photos, descriptions, and amenities, must be accurate and truthful. Any deceptive listings will result in immediate suspension.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>3. Bookings and Cancellations</h3>
        <p style={{ marginBottom: '1.5rem' }}>Hosts are responsible for honoring all confirmed bookings. Cancellations initiated by hosts without a valid reason (e.g., severe weather, property damage) may incur penalties or account suspension.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>4. Liability</h3>
        <p style={{ marginBottom: '1.5rem' }}>PakJai Travel is not liable for any injuries, property damage, or disputes that occur during a guest's stay. Hosts are highly encouraged to maintain their own property and liability insurance.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>5. Platform Fees</h3>
        <p style={{ marginBottom: '1.5rem' }}>During our launch phase, listing properties is free. In the future, a standard commission fee will apply to successful bookings, which will be communicated in advance.</p>
        
        <h3 style={{ color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>6. Termination</h3>
        <p style={{ marginBottom: '1.5rem' }}>We reserve the right to remove any listing or terminate any host account at our sole discretion for violations of these terms, poor reviews, or failure to maintain standards.</p>
      </div>
    </div>
  );
};
