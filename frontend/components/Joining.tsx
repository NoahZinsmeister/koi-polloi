import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { WebsocketClient } from '../websocket-client'
import { Other, You } from './Players'

export const Joining = ({
  gameId,
  websocket,
  onNameUpdate,
}: {
  gameId: string | string[] | undefined
  websocket: WebsocketClient | null
  onNameUpdate: (name: string) => void
}) => {
  const { you, others, benigoiHolder } = useStore()

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

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '6rem',
        }}
      >
        <h1 style={{ margin: '0 1rem 0 0' }}>game code:</h1>
        {typeof gameId === 'string' ? (
          <button
            style={{
              cursor: 'pointer',
              height: 'fit-content',
              minHeight: '2rem',
              marginRight: '0.5rem',
            }}
            onClick={() => {
              const shareData = {
                title: 'koi polloi',
                text: 'come play with me!',
                url: window.location.href,
              }

              if (navigator.canShare?.(shareData)) {
                navigator.share(shareData).catch(() => {})
              } else {
                const type = 'text/plain'
                const blob = new Blob([shareData.url], { type })
                const data = [new ClipboardItem({ [type]: blob })]
                navigator.clipboard.write(data).then(() => {
                  setCopied(true)
                })
              }
            }}
          >
            {gameId}
          </button>
        ) : null}
        <p style={{ margin: 0, visibility: copied ? 'visible' : 'hidden' }}>
          copied!
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '3rem',
          width: '100%',
        }}
      >
        <h1 style={{ margin: '0 1rem 0 0' }}>you:</h1>
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <You
            player={you}
            benigoiHolder={benigoiHolder}
            onNameUpdate={onNameUpdate}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '3rem',
          width: '100%',
        }}
      >
        <h1 style={{ margin: '0 1rem 0 0' }}>others:</h1>
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
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
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <button
          onClick={() => websocket?.advanceGameState()}
          disabled={Object.keys(others).length < 3}
        >
          start game
          {Object.keys(others).length < 3
            ? ` (${4 - 1 - Object.keys(others).length} more player${
                Object.keys(others).length === 2 ? '' : 's'
              } needed)`
            : ''}
        </button>
      </div>
    </>
  )
}
