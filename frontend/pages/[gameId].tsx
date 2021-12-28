import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { Container } from '../components/Container'
import { Joining } from '../components/Joining'
import { Playing } from '../components/Playing'
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

  const { questionIndex } = useStore()

  return (
    <Container centered={false}>
      {questionIndex === undefined || questionIndex < 0 ? (
        <Joining gameId={gameId} websocket={websocket.current} />
      ) : (
        <Playing websocket={websocket.current} />
      )}
    </Container>
  )
}

export default Game
