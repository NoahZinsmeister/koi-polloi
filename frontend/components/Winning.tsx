import React from 'react'
import { useStore } from '../store'
import { Other, You } from './Players'

export const Winning = ({
  winner,
  onNameUpdate,
}: {
  winner: number
  onNameUpdate: (name: string) => void
}) => {
  const { you, others, benigoiHolder, questionIndex, deadline, answers } =
    useStore()

  return (
    <>
      {[you!, ...Object.values(others)]
        .sort((a, b) => {
          if (a.joinOrder === benigoiHolder) {
            return 1
          } else if (b.joinOrder === benigoiHolder) {
            return -1
          } else if (a.joinOrder === winner) {
            return -1
          } else if (b.joinOrder === winner) {
            return 1
          } else {
            return a.koi > b.koi ? -1 : 1
          }
        })
        .map((player) =>
          player.joinOrder === you!.joinOrder ? (
            <You
              key={player.joinOrder}
              player={player}
              benigoiHolder={benigoiHolder}
              onNameUpdate={onNameUpdate}
            />
          ) : (
            <Other
              key={player.joinOrder}
              player={player}
              benigoiHolder={benigoiHolder}
            />
          )
        )}
    </>
  )
}
