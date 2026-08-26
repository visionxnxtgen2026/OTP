import React, { createContext, useContext, useMemo } from 'react'
import type { DDSProviderProps, DDSContextValue } from './types.js'

const DDSContext = createContext<DDSContextValue>({
  merchantApiUrl: 'http://localhost:5001'
})

export const DDSProvider: React.FC<DDSProviderProps> = ({
  children,
  merchantApiUrl = 'http://localhost:5001'
}) => {
  const value = useMemo(() => ({ merchantApiUrl }), [merchantApiUrl])

  return <DDSContext.Provider value={value}>{children}</DDSContext.Provider>
}

export function useDDSContext(): DDSContextValue {
  return useContext(DDSContext)
}
