import React, { Fragment, useEffect, useState } from 'react'
import { PlayerState } from '../../workers/src/koi-polloi'
import { QUESTIONS } from '../questions'
import { useStore } from '../store'
import { WebsocketClient } from '../websocket-client'
import { Deadline } from './Deadline'
import { Other, You } from './Players'

function determineWinner(
  you: PlayerState,
  others: PlayerState[],
  benigoiHolder: number | undefined
): number | undefined {
  const players = [you, ...others]
    .filter((a) => a.joinOrder !== benigoiHolder)
    .sort((a, b) => (a.koi > b.koi ? -1 : 1))

  if (players[0].koi >= 8 && players[1].koi < players[0].koi) {
    return players[0].joinOrder
  }
}

export const Playing = ({
  websocket,
  setWinner,
  onNameUpdate,
}: {
  websocket: WebsocketClient | null
  setWinner: (winer: number) => void
  onNameUpdate: (name: string) => void
}) => {
  const { you, others, benigoiHolder, questionIndex, deadline, answers } =
    useStore()

  const winner = determineWinner(you!, Object.values(others), benigoiHolder)

  const finalized = Object.keys(answers).length > 1

  const [yourAnswer, setYourAnswer] = useState(() =>
    you ? answers[you.joinOrder] : undefined
  )

  useEffect(() => {
    if (you) {
      setYourAnswer(answers[you.joinOrder])
    }
  }, [you, answers])

  const [answer, setAnswer] = useState<string>('')

  const [disabledBecauseOfTime, setDisabledBecauseOfTime] = useState(true)

  useEffect(() => {
    if (deadline === undefined) {
      setDisabledBecauseOfTime(true)
    } else {
      const now = Date.now()
      if (now >= deadline) {
        setDisabledBecauseOfTime(true)
      } else {
        setDisabledBecauseOfTime(false)

        const timeout = setTimeout(() => {
          setDisabledBecauseOfTime(true)
        }, deadline - now)

        return () => {
          clearTimeout(timeout)
        }
      }
    }
  }, [deadline])

  return (
    <>
      {deadline !== undefined && (
        <Deadline deadline={deadline} finalized={finalized} />
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <You
          player={you}
          benigoiHolder={benigoiHolder}
          onNameUpdate={onNameUpdate}
        />
        {Object.values(others)
          .sort((a, b) => (a.joinOrder < b.joinOrder ? -1 : 1))
          .map((other) => (
            <Other
              key={other.joinOrder}
              player={other}
              benigoiHolder={benigoiHolder}
            />
          ))}
      </div>

      <>
        {questionIndex !== undefined ? (
          <div>{QUESTIONS[questionIndex]}</div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            websocket?.submitAnswer(answer)
            setAnswer('')
          }}
        >
          <label>Most people would say...</label>
          <input
            type="text"
            value={
              disabledBecauseOfTime
                ? yourAnswer ?? ''
                : yourAnswer === undefined
                ? answer
                : yourAnswer
            }
            onChange={(e) => setAnswer(e.target.value.toLowerCase())}
            disabled={disabledBecauseOfTime || yourAnswer !== undefined}
          />
          {disabledBecauseOfTime ? null : (
            <input
              type="submit"
              value="submit"
              disabled={yourAnswer !== undefined || answer === ''}
            />
          )}
        </form>

        {Object.keys(answers)
          .sort((a, b) => {
            if (Number(a) === you!.joinOrder) {
              return -1
            } else if (Number(b) === you!.joinOrder) {
              return 1
            } else {
              return a < b ? -1 : 1
            }
          })
          .map((joinOrder) => {
            const answer = answers[Number(joinOrder)]
            const player =
              you!.joinOrder === Number(joinOrder)
                ? you
                : others[Number(joinOrder)]!
            const name = player!.name ?? `Player ${joinOrder}`
            return (
              <Fragment key={joinOrder}>
                <p>{name} said...</p>
                <p>{answer}</p>
              </Fragment>
            )
          })}

        {disabledBecauseOfTime || finalized ? (
          winner !== undefined ? (
            <button onClick={() => setWinner(winner)}>
              we have a winner...
            </button>
          ) : (
            <button onClick={() => websocket?.advanceGameState()}>
              next question
            </button>
          )
        ) : null}
      </>
    </>
  )
}
