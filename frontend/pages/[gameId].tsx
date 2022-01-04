import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Container } from '../components/Container'
import { Joining } from '../components/Joining'
import { Playing } from '../components/Playing'
import { Winning } from '../components/Winning'
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

  const onNameUpdate = useCallback(
    (name: string) => {
      websocket.current?.updateName(name)
    },
    [websocket]
  )

  const { questionIndex } = useStore()

  const [winner, setWinner] = useState<number | undefined>(undefined)

  return (
    <Container centered={false}>
      {winner !== undefined ? (
        <Winning winner={winner} onNameUpdate={onNameUpdate} />
      ) : questionIndex === undefined || questionIndex < 0 ? (
        <Joining
          gameId={gameId}
          websocket={websocket.current}
          onNameUpdate={onNameUpdate}
        />
      ) : (
        <Playing
          websocket={websocket.current}
          setWinner={setWinner}
          onNameUpdate={onNameUpdate}
        />
      )}
    </Container>
  )
}

export default Game
