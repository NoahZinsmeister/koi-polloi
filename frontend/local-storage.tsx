import { createContext, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const KEY = 'USER_ID'

function initialize(): string {
  try {
    const existingUserId = window.localStorage.getItem(KEY)
    if (existingUserId === null) {
      return uuidv4()
    }
    return existingUserId
  } catch {
    return uuidv4()
  }
}

const LocalStorageContext = createContext<string>('')

export interface LocalStorageProviderProps {
  children: React.ReactNode
}

export const LocalStorageProvider = ({
  children,
}: LocalStorageProviderProps) => {
  const [userId] = useState(initialize)

  useEffect(() => {
    window.localStorage.setItem(KEY, userId)
  }, [userId])

  return (
    <LocalStorageContext.Provider value={userId}>
      {children}
    </LocalStorageContext.Provider>
  )
}

function useLocalStorageContext() {
  return useContext(LocalStorageContext)
}

export function useUserId(): string {
  return useLocalStorageContext()
}
