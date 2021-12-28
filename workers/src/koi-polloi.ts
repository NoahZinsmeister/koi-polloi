const JOINED = 'JOINED'
const PLAYER_PREFIX = 'PLAYER'
const QUESTION_ORDER = 'QUESTION_ORDER'
const GAME_STATE = 'GAME_STATE'

const SECONDS_PER_ROUND = 60
export const NUMBER_OF_QUESTIONS = 3

export interface PlayerState {
  name?: string
  joinOrder: number
  koi: number
  benigoi: number
}

export interface GameState {
  questionIndex: number
  deadline: number
  answers: { [userId: string]: string }
}

export enum MessageToServerType {
  REQUEST_FOR_DATA = 'REQUEST_FOR_DATA',
  NAME_UPDATE = 'NAME_UPDATE',
  ADVANCE_GAME_STATE = 'ADVANCE_GAME_STATE'
}

export type MessageToServer =
  | { type: MessageToServerType.REQUEST_FOR_DATA }
  | { type: MessageToServerType.NAME_UPDATE; payload: string }
  | { type: MessageToServerType.ADVANCE_GAME_STATE }

export enum MessageToSingleClientType {
  ALL_PLAYERS = 'ALL_PLAYERS',
  INITIAL_GAME_STATE = 'INITIAL_GAME_STATE'
}

export enum MessageToEveryClientType {
  NEW_PLAYER = 'NEW_PLAYER',
  EXISTING_PLAYER_NAME_UPDATE = 'EXISTING_PLAYER_NAME_UPDATE',
  GAME_STATE_ADVANCED = 'GAME_STATE_ADVANCED'
}

type MessageToSingleClient =
  | {
      type: MessageToSingleClientType.ALL_PLAYERS
      payload: {
        you: PlayerState
        others: PlayerState[]
      }
    }
  | {
      type: MessageToSingleClientType.INITIAL_GAME_STATE
      payload: Omit<GameState, 'answers'>
    }

type MessageToEveryClient =
  | { type: MessageToEveryClientType.NEW_PLAYER; payload: PlayerState }
  | {
      type: MessageToEveryClientType.EXISTING_PLAYER_NAME_UPDATE
      payload: {
        joinOrder: number
        name: string
      }
    }
  | {
      type: MessageToEveryClientType.GAME_STATE_ADVANCED
      payload: Omit<GameState, 'answers'>
    }

export type MessageToClient = MessageToSingleClient | MessageToEveryClient

// fisher-yates shuffle from https://javascript.info/array-methods#shuffle-an-array
function shuffle(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)) // random index from 0 to i

      // swap elements array[i] and array[j]
      // we use "destructuring assignment" syntax to achieve that
      // you'll find more details about that syntax in later chapters
      // same can be written as:
      // let t = array[i]; array[i] = array[j]; array[j] = t
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export class KoiPolloi {
  readonly state: DurableObjectState

  joined: number = -1
  webSockets: { [userId: string]: WebSocket } = {}
  playerStates: { [prefixedUserId: string]: PlayerState } = {}
  questionOrder: number[] = []
  gameState: GameState = {
    questionIndex: -1,
    deadline: Number.MAX_SAFE_INTEGER,
    answers: {}
  }

  constructor(state: DurableObjectState) {
    this.state = state

    this.state.blockConcurrencyWhile(async () => {
      const [
        joined,
        playerStates,
        questionOrder,
        gameState
      ] = await Promise.all([
        this.state.storage.get<number>(JOINED),
        this.state.storage.list<PlayerState>({
          prefix: PLAYER_PREFIX
        }),
        this.state.storage.get<number[]>(QUESTION_ORDER),
        this.state.storage.get<GameState>(GAME_STATE)
      ])

      this.joined = joined ?? 0
      this.playerStates = Object.fromEntries(playerStates)
      this.questionOrder =
        questionOrder ??
        shuffle(Array.from({ length: NUMBER_OF_QUESTIONS }, (_, i) => i))
      this.gameState = gameState ?? {
        questionIndex: -1,
        deadline: Number.MAX_SAFE_INTEGER,
        answers: {}
      }
    })
  }

  getAndIncrementJoined() {
    const joined = this.joined++
    this.state.storage.put(JOINED, this.joined)
    return joined
  }

  getPlayerState(userId: string): PlayerState | undefined {
    return this.playerStates[`${PLAYER_PREFIX}-${userId}`]
  }

  setPlayerState(userId: string, playerState: PlayerState) {
    const prefixedUserId = `${PLAYER_PREFIX}-${userId}`
    this.playerStates[prefixedUserId] = playerState
    this.state.storage.put(prefixedUserId, playerState)
  }

  advanceGameState() {
    this.gameState = {
      questionIndex: this.gameState.questionIndex + 1,
      deadline: Date.now() + SECONDS_PER_ROUND * 1000,
      answers: {}
    }

    this.sendMessageToEveryClient({
      type: MessageToEveryClientType.GAME_STATE_ADVANCED,
      payload: {
        questionIndex: this.gameState.questionIndex,
        deadline: this.gameState.deadline
      }
    })

    this.state.storage.put(GAME_STATE, this.gameState)
  }

  sendMessageToSingleClient(
    webSocket: WebSocket,
    message: MessageToSingleClient
  ) {
    webSocket.send(JSON.stringify(message))
  }

  sendMessageToEveryClient(message: MessageToEveryClient) {
    Object.values(this.webSockets).forEach(webSocket => {
      webSocket.send(JSON.stringify(message))
    })
  }

  async handleSession(webSocket: WebSocket, userId: string) {
    // @ts-ignore
    webSocket.accept()

    const messageHandler = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        const message: MessageToServer = JSON.parse(event.data)

        switch (message.type) {
          case MessageToServerType.REQUEST_FOR_DATA: {
            let you: PlayerState
            let others: PlayerState[] = []

            Object.keys(this.playerStates).forEach(prefixedUserId => {
              const playerState = this.playerStates[prefixedUserId]

              if (prefixedUserId.endsWith(userId)) {
                you = playerState
              } else {
                others.push(playerState)
              }
            })

            this.sendMessageToSingleClient(webSocket, {
              type: MessageToSingleClientType.ALL_PLAYERS,
              payload: {
                you: you!,
                others
              }
            })

            this.sendMessageToSingleClient(webSocket, {
              type: MessageToSingleClientType.INITIAL_GAME_STATE,
              payload: {
                questionIndex: this.gameState.questionIndex,
                deadline: this.gameState.deadline
              }
            })
            break
          }
          case MessageToServerType.NAME_UPDATE: {
            const playerState = this.getPlayerState(userId)
            this.setPlayerState(userId, {
              ...playerState!,
              name: message.payload
            })
            return this.sendMessageToEveryClient({
              type: MessageToEveryClientType.EXISTING_PLAYER_NAME_UPDATE,
              payload: {
                joinOrder: playerState!.joinOrder,
                name: message.payload
              }
            })
          }
          case MessageToServerType.ADVANCE_GAME_STATE: {
            return this.advanceGameState()
          }
        }
      }
    }

    const errorHandler = (event: Event) => {
      console.error(event)
      webSocket.close()
      cleanup()
    }

    const closeHandler = () => {
      cleanup()
    }

    const cleanup = () => {
      webSocket.removeEventListener('message', messageHandler)
      webSocket.removeEventListener('error', errorHandler)
      webSocket.removeEventListener('close', closeHandler)
      delete this.webSockets[userId]
    }

    webSocket.addEventListener('message', messageHandler)
    webSocket.addEventListener('error', errorHandler)
    webSocket.addEventListener('close', closeHandler)

    this.webSockets[userId] = webSocket

    let playerState = this.getPlayerState(userId)
    if (!playerState) {
      playerState = {
        joinOrder: this.getAndIncrementJoined(),
        koi: 0,
        benigoi: 0
      }
      this.setPlayerState(userId, playerState)
      this.sendMessageToEveryClient({
        type: MessageToEveryClientType.NEW_PLAYER,
        payload: playerState
      })
    }
  }

  async fetch(request: Request) {
    const url = new URL(request.url)

    switch (url.pathname) {
      case '/ws': {
        if (request.headers.get('Upgrade') !== 'websocket') {
          return new Response('Expected Upgrade: websocket', { status: 426 })
        }

        const { 0: client, 1: server } = new WebSocketPair()

        const params = new URLSearchParams(url.search)
        const userId = params.get('userId')
        if (!userId) {
          return new Response('Missing userId', { status: 404 })
        }

        await this.handleSession(server, userId)

        return new Response(null, { status: 101, webSocket: client })
      }
      default: {
        return new Response('Not found', { status: 404 })
      }
    }
  }
}
