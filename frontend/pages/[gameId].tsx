import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import styles from '../styles/Game.module.css'
import { WebsocketClient } from '../websocket-client'

const Game: NextPage = () => {
  const router = useRouter()
  const { query } = router
  const { gameId } = query

  const websocket = useRef<WebsocketClient | null>(null)
  useEffect(() => {
    if (typeof gameId === 'string') {
      websocket.current = new WebsocketClient(gameId)
    }

    return () => {
      websocket.current?.close()
      websocket.current = null
    }
  }, [gameId])

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Game Id: {gameId}</h1>
        <button onClick={() => websocket.current?.send('ping')}>Ping</button>
      </main>
    </div>
  )
}

export default Game
