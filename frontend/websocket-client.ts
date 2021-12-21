import {
  AllPlayersResponse,
  MessageToClient,
  MessageToClients,
  MessageToServer,
  NameUpdateBroadcast,
  NewPlayerBroadcast,
} from '../workers/src/koi-polloi'
import { Store, useStore } from './store'

export class WebsocketClient {
  private readonly webSocket: WebSocket
  private readonly open: Promise<void>

  constructor(gameId: string, userId: string) {
    this.webSocket = new WebSocket(
      `ws://${process.env.NEXT_PUBLIC_URL}/ws?gameId=${gameId}&userId=${userId}`
    )

    this.open = new Promise((resolve) => {
      this.webSocket.addEventListener('open', () => {
        this.webSocket.send(
          JSON.stringify({
            type: MessageToServer.REQUEST_FOR_ALL_PLAYERS,
          })
        )

        resolve()
      })
    })

    this.webSocket.addEventListener('message', (event) => {
      const { type, payload } = JSON.parse(event.data)

      switch (type) {
        case MessageToClient.ALL_PLAYERS: {
          const { you, others } = payload as AllPlayersResponse
          useStore.setState({ you })
          useStore.setState({
            others: {
              ...others.reduce((accumulator: Store['others'], current) => {
                accumulator[current.joinOrder.toString()] = current
                return accumulator
              }, {}),
            },
          })
          break
        }
        case MessageToClients.NEW_PLAYER: {
          const other = payload as NewPlayerBroadcast
          const { others } = useStore.getState()
          useStore.setState({
            others: {
              ...others,
              [other.joinOrder.toString()]: other,
            },
          })
          break
        }
        case MessageToClients.NAME_UPDATE: {
          const { joinOrder, name } = payload as NameUpdateBroadcast
          const { you, others } = useStore.getState()
          if (you?.joinOrder === joinOrder) {
            useStore.setState({ you: { ...you, name } })
          } else {
            useStore.setState({
              others: {
                ...others,
                [joinOrder.toString()]: {
                  ...others[joinOrder.toString()],
                  name,
                },
              },
            })
          }
        }
      }
    })
  }

  async updateName(name: string) {
    await this.open
    this.webSocket.send(
      JSON.stringify({
        type: MessageToServer.NAME_UPDATE,
        payload: name,
      })
    )
  }

  close() {
    this.webSocket.close()
  }
}
