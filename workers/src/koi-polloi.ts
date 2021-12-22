const JOINED = 'JOINED'
const PLAYER_PREFIX = 'PLAYER'

export interface PlayerStorage {
  name?: string
  joinOrder: number
  koi: number
  benigoi: number
}

export enum MessageToServer {
  REQUEST_FOR_ALL_PLAYERS = 'REQUEST_FOR_ALL_PLAYERS',
  NAME_UPDATE = 'NAME_UPDATE_TO_SERVER'
}

export enum MessageToClient {
  ALL_PLAYERS = 'ALL_PLAYERS'
}

export enum MessageToClients {
  NEW_PLAYER = 'NEW_PLAYER',
  NAME_UPDATE = 'NAME_UPDATE_TO_CLIENTS'
}

export interface AllPlayersResponse {
  you: PlayerStorage
  others: PlayerStorage[]
}

export type NewPlayerBroadcast = PlayerStorage

export interface NameUpdateBroadcast {
  joinOrder: number
  name: string
}

export class KoiPolloi {
  joined: number = 0
  webSockets: { [key: string]: WebSocket } = {}
  readonly state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state

    this.state.blockConcurrencyWhile?.(async () => {
      this.joined = (await this.state.storage.get<number>(JOINED)) ?? 0
    })
  }

  getPlayerWebSocket(userId: string) {
    return this.webSockets[userId]
  }

  setPlayerWebSocket(userId: string, webSocket: WebSocket) {
    this.webSockets[userId] = webSocket
  }

  deletePlayerWebSocket(userId: string) {
    delete this.webSockets[userId]
  }

  getPlayerStorage(userId: string) {
    return this.state.storage.get<PlayerStorage>(`${PLAYER_PREFIX}-${userId}`)
  }

  setPlayerStorage(userId: string, playerStorage: PlayerStorage) {
    return this.state.storage.put(`${PLAYER_PREFIX}-${userId}`, playerStorage)
  }

  async getPlayersPayload(userId: string): Promise<AllPlayersResponse> {
    const allPlayers = await this.state.storage.list<PlayerStorage>({
      prefix: PLAYER_PREFIX
    })

    let you: PlayerStorage
    let others: PlayerStorage[] = []

    allPlayers.forEach((value, key) => {
      if (key.endsWith(userId)) {
        you = value
      } else {
        others.push(value)
      }
    })

    return { you: you!, others }
  }

  sendToClient(
    webSocket: WebSocket,
    type: MessageToClient,
    payload: AllPlayersResponse
  ) {
    webSocket.send(
      JSON.stringify({
        type,
        payload
      })
    )
  }

  sendPlayers(webSocket: WebSocket, payload: AllPlayersResponse) {
    this.sendToClient(webSocket, MessageToClient.ALL_PLAYERS, payload)
  }

  broadcast(
    type: MessageToClients,
    payload: NewPlayerBroadcast | NameUpdateBroadcast
  ) {
    Object.values(this.webSockets).forEach(webSocket => {
      webSocket.send(
        JSON.stringify({
          type,
          payload
        })
      )
    })
  }

  broadcastNewPlayer(payload: NewPlayerBroadcast) {
    this.broadcast(MessageToClients.NEW_PLAYER, payload)
  }

  broadcastNameUpdate(payload: NameUpdateBroadcast) {
    this.broadcast(MessageToClients.NAME_UPDATE, payload)
  }

  async handleSession(webSocket: WebSocket, userId: string) {
    // @ts-ignore
    webSocket.accept()

    const messageHandler = async (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        const { type, payload } = JSON.parse(event.data)

        switch (type) {
          case MessageToServer.REQUEST_FOR_ALL_PLAYERS: {
            const { you, others } = await this.getPlayersPayload(userId)
            return this.sendPlayers(webSocket, { you, others })
          }
          case MessageToServer.NAME_UPDATE: {
            const playerStorage = await this.getPlayerStorage(userId)
            if (playerStorage) {
              this.setPlayerStorage(userId, {
                ...playerStorage,
                name: payload as string
              })
              this.broadcastNameUpdate({
                joinOrder: playerStorage.joinOrder,
                name: payload as string
              })
            }
            break
          }
        }
      }
    }

    const errorHandler = async (event: Event) => {
      console.error(event)
      webSocket.close()
      cleanup()
    }

    const closeHandler = async () => {
      cleanup()
    }

    const cleanup = async () => {
      this.deletePlayerWebSocket(userId)
      webSocket.removeEventListener('message', messageHandler)
      webSocket.removeEventListener('error', errorHandler)
      webSocket.removeEventListener('close', closeHandler)
    }

    webSocket.addEventListener('message', messageHandler)
    webSocket.addEventListener('error', errorHandler)
    webSocket.addEventListener('close', closeHandler)

    let playerStorage = await this.getPlayerStorage(userId)
    if (!playerStorage) {
      playerStorage = {
        joinOrder: this.joined++,
        koi: 0,
        benigoi: 0
      }
      this.setPlayerStorage(userId, playerStorage)
      this.state.storage.put(JOINED, this.joined)
    }
    this.broadcastNewPlayer(playerStorage)
    this.setPlayerWebSocket(userId, webSocket)
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
