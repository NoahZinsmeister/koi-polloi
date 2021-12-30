import create from 'zustand'
import { PlayerState } from '../workers/src/koi-polloi'

export interface Store {
  you?: PlayerState
  others: { [joinOrder: number]: PlayerState }
  benigoiHolder?: number
  questionIndex?: number
  deadline?: number
  answers: { [joinOrder: number]: string }
}

export const useStore = create<Store>(() => ({
  others: {},
  answers: {},
}))
