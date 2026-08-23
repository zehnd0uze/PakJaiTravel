import React from 'react';
import './TermsModal.css';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | null;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen || !type) return null;

  return (
    <div className="terms-modal-backdrop" onClick={onClose}>
      <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h2>{type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</h2>
          <button className="terms-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="terms-modal-body">
          {type === 'terms' ? (
            <div className="terms-text">
              <h3>1. Acceptance of Terms</h3>
              <p>By registering an account and listing a property on PakJai Travel, you agree to abide by these terms. We serve as a booking platform connecting travelers with hosts in Chiang Dao.</p>
              
              <h3>2. Host Responsibilities</h3>
              <p>You confirm that you are the legal owner or authorized manager of any property you list. All information provided, including photos, descriptions, and amenities, must be accurate and truthful. Any deceptive listings will result in immediate suspension.</p>
              
              <h3>3. Bookings and Cancellations</h3>
              <p>Hosts are responsible for honoring all confirmed bookings. Cancellations initiated by hosts without a valid reason (e.g., severe weather, property damage) may incur penalties or account suspension.</p>
              
              <h3>4. Liability</h3>
              <p>PakJai Travel is not liable for any injuries, property damage, or disputes that occur during a guest's stay. Hosts are highly encouraged to maintain their own property and liability insurance.</p>
              
              <h3>5. Platform Fees</h3>
              <p>During our launch phase, listing properties is free. In the future, a standard commission fee will apply to successful bookings, which will be communicated in advance.</p>
              
              <h3>6. Termination</h3>
              <p>We reserve the right to remove any listing or terminate any host account at our sole discretion for violations of these terms, poor reviews, or failure to maintain standards.</p>
            </div>
          ) : (
            <div className="terms-text">
              <h3>1. Information We Collect</h3>
              <p>We collect personal information when you register, including your name, email address, phone number, and Line ID. For hosts, we may collect business registration or tax details to verify property ownership.</p>
              
              <h3>2. How We Use Your Information</h3>
              <p>Your information is used to facilitate bookings, communicate important updates, verify host identities, and improve our platform's services. Your contact information is shared with guests only when a booking is confirmed.</p>
              
              <h3>3. Data Security</h3>
              <p>We implement strict security measures to protect your data. Information is stored securely using encrypted databases. We do not sell your personal data to third parties.</p>
              
              <h3>4. User Rights</h3>
              <p>You have the right to access, update, or delete your personal information at any time. You can manage this through your profile settings or by contacting our support team.</p>
              
              <h3>5. Cookies</h3>
              <p>We use cookies to improve user experience, remember your preferences, and analyze site traffic. You can disable cookies in your browser settings, though this may affect site functionality.</p>
              
              <h3>6. Policy Updates</h3>
              <p>We may update this Privacy Policy periodically. Users will be notified of significant changes via email or an in-app notification.</p>
            </div>
          )}
        </div>
        <div className="terms-modal-footer">
          <button className="terms-btn" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </div>
  );
};
