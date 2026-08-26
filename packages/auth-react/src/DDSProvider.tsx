import React, { createContext, useContext } from 'react'
import type { DDSProviderConfig } from './types.js'

interface DDSContextValue {
  merchantApiUrl: string
  defaultOrigin?: string
}

const DDSContext = createContext<DDSContextValue | null>(null)

export const DDSProvider: React.FC<DDSProviderConfig> = ({
  merchantApiUrl,
  defaultOrigin,
  children
}) => {
  return (
    <DDSContext.Provider
      value={{
        merchantApiUrl: merchantApiUrl.replace(/\/$/, ''),
        defaultOrigin
      }}
    >
      {children}
    </DDSContext.Provider>
  )
}

export function useDDSContext(): DDSContextValue {
  const context = useContext(DDSContext)
  if (!context) {
    return {
      merchantApiUrl: 'http://localhost:5001'
    }
  }
  return context
}
