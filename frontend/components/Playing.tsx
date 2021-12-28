import { useCallback, useEffect, useState } from 'react'
import { QUESTIONS } from '../questions'
import { useStore } from '../store'
import { WebsocketClient } from '../websocket-client'
import { Other, You } from './Players'

export const Playing = ({
  websocket,
}: {
  websocket: WebsocketClient | null
}) => {
  const { you, others, questionIndex } = useStore()

  const onNameUpdate = useCallback(
    (name: string) => {
      websocket?.updateName(name)
    },
    [websocket]
  )

  const [copied, setCopied] = useState<boolean>(false)
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 750)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [copied])

  const [answer, setAnswer] = useState<string>('')

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <You player={you} onNameUpdate={onNameUpdate} />
        {Object.values(others)
          .sort((a, b) => (a.joinOrder < b.joinOrder ? -1 : 1))
          .map((other) => (
            <Other key={other.joinOrder} player={other} />
          ))}
      </div>

      {questionIndex !== undefined ? (
        <>
          <div>{QUESTIONS[questionIndex]}</div>
          <input
            style={{
              borderWidth: 0,
              borderBottomWidth: 'thin',
            }}
            spellCheck={false}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value)
              // report answer to server
            }}
          />
        </>
      ) : null}
    </>
  )
}
