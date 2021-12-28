import {
  MessageToClient,
  MessageToEveryClientType,
  MessageToServer,
  MessageToServerType,
  MessageToSingleClientType,
} from '../workers/src/koi-polloi'
import { Store, useStore } from './store'

export class WebsocketClient {
  private readonly webSocket: WebSocket
  private readonly open: Promise<void>

  constructor(gameId: string, userId: string) {
    this.webSocket = new WebSocket(
      `${process.env.NEXT_PUBLIC_URL}/ws?gameId=${gameId}&userId=${userId}`
    )

    this.open = new Promise((resolve) => {
      this.webSocket.addEventListener('open', () => {
        resolve()

        this.sendMessageToServer({
          type: MessageToServerType.REQUEST_FOR_ALL_PLAYERS,
        })
      })
    })

    this.webSocket.addEventListener('message', (event) => {
      const message: MessageToClient = JSON.parse(event.data)

      switch (message.type) {
        case MessageToSingleClientType.ALL_PLAYERS: {
          const { you, others } = message.payload
          useStore.setState({
            you,
            others: {
              ...others.reduce((accumulator: Store['others'], current) => {
                accumulator[current.joinOrder.toString()] = current
                return accumulator
              }, {}),
            },
          })
          break
        }
        case MessageToEveryClientType.NEW_PLAYER: {
          const other = message.payload
          const { others } = useStore.getState()
          useStore.setState({
            others: {
              ...others,
              [other.joinOrder.toString()]: other,
            },
          })
          break
        }
        case MessageToEveryClientType.EXISTING_PLAYER_NAME_UPDATE: {
          const { joinOrder, name } = message.payload
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

  async sendMessageToServer(message: MessageToServer) {
    await this.open
    this.webSocket.send(JSON.stringify(message))
  }

  async updateName(name: string) {
    this.sendMessageToServer({
      type: MessageToServerType.NAME_UPDATE,
      payload: name,
    })
  }

  close() {
    this.webSocket.close()
  }
}
