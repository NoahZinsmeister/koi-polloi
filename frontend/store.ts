import create from 'zustand'
import { PlayerStorage } from '../workers/src/koi-polloi'

export interface Store {
  you?: PlayerStorage
  others: { [joinOrder: string]: PlayerStorage }
}

export const useStore = create<Store>(() => ({
  others: {},
}))
