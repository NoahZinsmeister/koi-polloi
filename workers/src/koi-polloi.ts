const JOINED = 'JOINED'
const PLAYER_PREFIX = 'PLAYER'

export interface PlayerState {
  name?: string
  joinOrder: number
  koi: number
  benigoi: number
}

export enum MessageToServerType {
  REQUEST_FOR_ALL_PLAYERS = 'REQUEST_FOR_ALL_PLAYERS',
  NAME_UPDATE = 'NAME_UPDATE'
}

export type MessageToServer =
  | { type: MessageToServerType.REQUEST_FOR_ALL_PLAYERS }
  | { type: MessageToServerType.NAME_UPDATE; payload: string }

export enum MessageToSingleClientType {
  ALL_PLAYERS = 'ALL_PLAYERS'
}

export enum MessageToEveryClientType {
  NEW_PLAYER = 'NEW_PLAYER',
  EXISTING_PLAYER_NAME_UPDATE = 'EXISTING_PLAYER_NAME_UPDATE'
}

type MessageToSingleClient = {
  type: MessageToSingleClientType.ALL_PLAYERS
  payload: {
    you: PlayerState
    others: PlayerState[]
  }
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

export type MessageToClient = MessageToSingleClient | MessageToEveryClient

export class KoiPolloi {
  readonly state: DurableObjectState

  joined: number = 0
  webSockets: { [userId: string]: WebSocket } = {}
  playerStates: { [prefixedUserId: string]: PlayerState } = {}

  constructor(state: DurableObjectState) {
    this.state = state

    this.state.blockConcurrencyWhile(async () => {
      const [joined, playerStates] = await Promise.all([
        this.state.storage.get<number>(JOINED),
        this.state.storage.list<PlayerState>({
          prefix: PLAYER_PREFIX
        })
      ])

      this.joined = joined ?? 0
      this.playerStates = Object.fromEntries(playerStates)
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
          case MessageToServerType.REQUEST_FOR_ALL_PLAYERS: {
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

            return this.sendMessageToSingleClient(webSocket, {
              type: MessageToSingleClientType.ALL_PLAYERS,
              payload: {
                you: you!,
                others
              }
            })
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
