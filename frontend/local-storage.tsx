import { createContext, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const KEY = 'USER_ID'

function initialize(): string {
  try {
    const existingUserId = window.sessionStorage.getItem(KEY)
    if (existingUserId === null) {
      return uuidv4()
    }
    return existingUserId
  } catch {
    return uuidv4()
  }
}

const SessionStorageContext = createContext<string>('')

export interface SessionStorageProviderProps {
  children: React.ReactNode
}

export const SessionStorageProvider = ({
  children,
}: SessionStorageProviderProps) => {
  const [userId] = useState(initialize)

  useEffect(() => {
    window.sessionStorage.setItem(KEY, userId)
  }, [userId])

  return (
    <SessionStorageContext.Provider value={userId}>
      {children}
    </SessionStorageContext.Provider>
  )
}

function useSessionStorageContext() {
  return useContext(SessionStorageContext)
}

export function useUserId(): string {
  return useSessionStorageContext()
}
