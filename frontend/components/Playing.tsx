import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { QUESTIONS } from '../questions'
import { useStore } from '../store'
import { WebsocketClient } from '../websocket-client'
import { Deadline } from './Deadline'
import { Other, You } from './Players'

export const Playing = ({
  websocket,
}: {
  websocket: WebsocketClient | null
}) => {
  const { you, others, benigoiHolder, questionIndex, deadline, answers } =
    useStore()

  const finalized = Object.keys(answers).length > 1

  const onNameUpdate = useCallback(
    (name: string) => {
      websocket?.updateName(name)
    },
    [websocket]
  )

  const [yourAnswer, setYourAnswer] = useState(() =>
    you ? answers[you.joinOrder] : undefined
  )
  useEffect(() => {
    if (you) {
      setYourAnswer(answers[you.joinOrder])
    }
  }, [you, answers])

  const [answer, setAnswer] = useState<string>('')

  const [disabledBecauseOfTime, setDisabledBecauseOfTime] = useState(() =>
    deadline === undefined ? true : Date.now() >= deadline ? true : false
  )
  useEffect(() => {
    if (deadline !== undefined) {
      const now = Date.now()
      if (now >= deadline) {
        setDisabledBecauseOfTime(true)
      } else {
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
              disabled={yourAnswer !== undefined}
            />
          )}
        </form>

        {Object.keys(answers).map((joinOrder) => {
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
          <button onClick={() => websocket?.advanceGameState()}>
            next question
          </button>
        ) : null}
      </>
    </>
  )
}
