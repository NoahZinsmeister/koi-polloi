import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef } from 'react'
import { Container } from '../components/Container'
import { Other, You } from '../components/Players'
import { useUserId } from '../local-storage'
import { useStore } from '../store'
import { WebsocketClient } from '../websocket-client'

const Game: NextPage = () => {
  const {
    query: { gameId },
  } = useRouter()

  const userId = useUserId()

  const websocket = useRef<WebsocketClient | null>(null)
  useEffect(() => {
    if (typeof gameId === 'string') {
      websocket.current = new WebsocketClient(gameId, userId)
    }

    return () => {
      websocket.current?.close()
      websocket.current = null
    }
  }, [gameId, userId])

  const { you, others } = useStore()

  const onNameUpdate = useCallback((name: string) => {
    websocket.current?.updateName(name)
  }, [])

  return (
    <Container>
      <h1>Game Id: {gameId}</h1>

      <You
        player={you}
        onNameUpdate={onNameUpdate}
        style={{ marginBottom: others.length ? 0 : '1rem' }}
      />

      {Object.values(others)
        .sort((a, b) => (a.joinOrder < b.joinOrder ? -1 : 1))
        .map((other, i, others) => (
          <Other
            key={other.joinOrder}
            player={other}
            style={{
              marginBottom: i === others.length ? 0 : '1rem',
            }}
          />
        ))}
    </Container>
  )
}

export default Game
