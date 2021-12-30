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
          type: MessageToServerType.REQUEST_FOR_DATA,
        })
      })
    })

    this.webSocket.addEventListener('message', (event) => {
      const message: MessageToClient = JSON.parse(event.data)

      switch (message.type) {
        case MessageToSingleClientType.ALL_PLAYERS: {
          const { you, others, benigoiHolder } = message.payload
          useStore.setState({
            you,
            others: {
              ...others.reduce((accumulator: Store['others'], current) => {
                accumulator[current.joinOrder] = current
                return accumulator
              }, {}),
            },
            benigoiHolder,
          })

          break
        }
        case MessageToEveryClientType.NEW_PLAYER: {
          const other = message.payload
          const { others } = useStore.getState()
          useStore.setState({
            others: {
              ...others,
              [other.joinOrder]: other,
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
                [joinOrder]: {
                  ...others[joinOrder],
                  name,
                },
              },
            })
          }

          break
        }
        case MessageToSingleClientType.INITIAL_GAME_STATE: {
          const { questionIndex, deadline } = message.payload
          useStore.setState({
            questionIndex,
            deadline,
          })

          break
        }
        case MessageToEveryClientType.GAME_STATE_ADVANCED: {
          const update = message.payload
          useStore.setState({
            ...update,
            answers: {},
          })

          break
        }
        case MessageToEveryClientType.ROUND_FINALIZED: {
          const { answers, koi, benigoiHolder } = message.payload

          const { you, others } = useStore.getState()

          Object.keys(koi).forEach((joinOrder) => {
            if (Number(joinOrder) === you!.joinOrder) {
              you!.koi = koi[Number(joinOrder)]
            } else {
              others[Number(joinOrder)].koi = koi[Number(joinOrder)]
            }
          })

          useStore.setState({
            you,
            others,
            answers,
            benigoiHolder,
          })

          break
        }
      }
    })
  }

  async sendMessageToServer(message: MessageToServer) {
    await this.open
    this.webSocket.send(JSON.stringify(message))
  }

  updateName(name: string) {
    this.sendMessageToServer({
      type: MessageToServerType.NAME_UPDATE,
      payload: name,
    })
  }

  advanceGameState() {
    this.sendMessageToServer({
      type: MessageToServerType.ADVANCE_GAME_STATE,
    })
  }

  submitAnswer(answer: string) {
    const { you, answers } = useStore.getState()

    useStore.setState({
      answers: {
        ...answers,
        [you!.joinOrder]: answer,
      },
    })
    this.sendMessageToServer({
      type: MessageToServerType.SUBMIT_ANSWER,
      payload: answer,
    })
  }

  close() {
    this.webSocket.close()
  }
}
