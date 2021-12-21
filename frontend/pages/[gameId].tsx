import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { Player } from '../components/Player'
import { useStore } from '../store'
import styles from '../styles/Game.module.css'
import { WebsocketClient } from '../websocket-client'

const Game: NextPage = () => {
  const {
    query: { gameId, userId },
  } = useRouter()

  const websocket = useRef<WebsocketClient | null>(null)
  useEffect(() => {
    if (typeof gameId === 'string') {
      websocket.current = new WebsocketClient(
        gameId,
        typeof userId === 'string' ? userId : ''
      )
    }

    return () => {
      websocket.current?.close()
      websocket.current = null
    }
  }, [gameId, userId])

  const { you, others } = useStore()

  const [name, setName] = useState('')

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Game Id: {gameId}</h1>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            websocket.current?.updateName(e.target.value)
          }}
        />
        <h1>You</h1>
        <Player player={you} />
        <h1>Others</h1>
        {Object.values(others)
          .sort((a, b) => (a.joinOrder < b.joinOrder ? -1 : 1))
          .map((other) => (
            <Player key={other.joinOrder} player={other} />
          ))}
      </main>
    </div>
  )
}

export default Game
