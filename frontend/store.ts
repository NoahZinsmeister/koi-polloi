import create from 'zustand'
import { PlayerState } from '../workers/src/koi-polloi'

export interface Store {
  you?: PlayerState
  others: { [joinOrder: string]: PlayerState }
}

export const useStore = create<Store>(() => ({
  others: {},
}))
