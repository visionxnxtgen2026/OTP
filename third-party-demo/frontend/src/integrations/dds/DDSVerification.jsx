import React from 'react'
import { DDSProvider, DDSVerificationButton } from 'dds-auth-zogoal/react'

/**
 * DDSVerification — drop-in DDS verification component
 * Usage: <DDSVerification merchantApiUrl="http://localhost:5001" onSuccess={fn} />
 */
export const DDSVerification = ({ merchantApiUrl, onSuccess, buttonText, className }) => (
  <DDSProvider merchantApiUrl={merchantApiUrl}>
    <DDSVerificationButton
      merchantApiUrl={merchantApiUrl}
      onVerified={onSuccess}
      buttonText={buttonText || 'Verify Identity with DDS'}
      className={className}
    />
  </DDSProvider>
)

export default DDSVerification
