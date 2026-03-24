import React from 'react';
import './VerifiedBadge.css';

export const VerifiedBadge: React.FC = () => {
  return (
    <div className="verified-badge" title="This property has been verified by PakJaiTravel to protect against scams.">
      <span className="verified-text">PakJai Verified</span>
    </div>
  );
};
