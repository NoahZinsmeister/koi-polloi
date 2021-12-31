const JOINED = 'JOINED'
const PLAYER_PREFIX = 'PLAYER'
const BENIGOI_HOLDER = 'BENIGOI_HOLDER'
const QUESTION_ORDER = 'QUESTION_ORDER'
const GAME_STATE = 'GAME_STATE'

const SECONDS_PER_ROUND = 60
export const NUMBER_OF_QUESTIONS = 3

export interface PlayerState {
  name?: string
  joinOrder: number
  koi: number
}

export interface GameState {
  questionIndex: number
  deadline: number
  answers: { [userId: string]: string }
  finalized: boolean
}

export enum MessageToServerType {
  REQUEST_FOR_DATA = 'REQUEST_FOR_DATA',
  NAME_UPDATE = 'NAME_UPDATE',
  ADVANCE_GAME_STATE = 'ADVANCE_GAME_STATE',
  SUBMIT_ANSWER = 'SUBMIT_ANSWER'
}

export type MessageToServer =
  | { type: MessageToServerType.REQUEST_FOR_DATA }
  | { type: MessageToServerType.NAME_UPDATE; payload: string }
  | { type: MessageToServerType.ADVANCE_GAME_STATE }
  | { type: MessageToServerType.SUBMIT_ANSWER; payload: string }

export enum MessageToSingleClientType {
  ALL_PLAYERS_AND_GAME_STATE = 'ALL_PLAYERS_AND_GAME_STATE'
}

export enum MessageToEveryClientType {
  NEW_PLAYER = 'NEW_PLAYER',
  EXISTING_PLAYER_NAME_UPDATE = 'EXISTING_PLAYER_NAME_UPDATE',
  GAME_STATE_ADVANCED = 'GAME_STATE_ADVANCED',
  ROUND_FINALIZED = 'ROUND_FINALIZED'
}

type MessageToSingleClient = {
  type: MessageToSingleClientType.ALL_PLAYERS_AND_GAME_STATE
  payload: {
    you: PlayerState
    others: PlayerState[]
    benigoiHolder: number | undefined
  } & Omit<GameState, 'answers' | 'finalized'> & {
      answer: string | undefined
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
  | {
      type: MessageToEveryClientType.GAME_STATE_ADVANCED
      payload: Omit<GameState, 'answers' | 'finalized'>
    }
  | {
      type: MessageToEveryClientType.ROUND_FINALIZED
      payload: {
        answers: { [joinOrder: number]: string }
        koi: { [joinOrder: number]: number }
        benigoiHolder: number | undefined
      }
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
  benigoiHolder: string | undefined = undefined
  questionOrder: number[] = []
  gameState: GameState = {
    questionIndex: -1,
    deadline: 0,
    answers: {},
    finalized: false
  }

  constructor(state: DurableObjectState) {
    this.state = state

    this.state.blockConcurrencyWhile(async () => {
      const [
        joined,
        playerStates,
        benigoiHolder,
        questionOrder,
        gameState
      ] = await Promise.all([
        this.state.storage.get<number>(JOINED),
        this.state.storage.list<PlayerState>({
          prefix: PLAYER_PREFIX
        }),
        this.state.storage.get<string>(BENIGOI_HOLDER),
        this.state.storage.get<number[]>(QUESTION_ORDER),
        this.state.storage.get<GameState>(GAME_STATE)
      ])

      this.joined = joined ?? 0
      this.playerStates = Object.fromEntries(playerStates)
      this.benigoiHolder = benigoiHolder
      if (questionOrder === undefined) {
        this.questionOrder = shuffle(
          Array.from({ length: NUMBER_OF_QUESTIONS }, (_, i) => i)
        )
        this.state.storage.put(QUESTION_ORDER, this.questionOrder)
      } else {
        this.questionOrder = questionOrder
      }
      this.gameState = gameState ?? {
        questionIndex: -1,
        deadline: 0,
        answers: {},
        finalized: true
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

  setGameState(gameState: GameState) {
    this.gameState = gameState
    this.state.storage.put(GAME_STATE, this.gameState)
  }

  finalizeRound() {
    const answers: { [joinOrder: number]: string } = {}
    const koi: { [joinOrder: number]: number } = {}

    const answersByPrevalence = Object.values(this.gameState.answers).reduce<{
      [answer: string]: number
    }>((accumulator, answer) => {
      accumulator[answer] = (accumulator[answer] ?? 0) + 1
      return accumulator
    }, {})
    const pluralityThreshold = Math.max(...Object.values(answersByPrevalence))
    const possibleAnswers = Object.keys(answersByPrevalence).filter(
      answer => answersByPrevalence[answer] === pluralityThreshold
    )
    const winningAnswer =
      possibleAnswers.length === 1 ? possibleAnswers[0] : undefined
    let losingAnswer: string | undefined

    if (Object.keys(answersByPrevalence).length === 2) {
      const otherAnswer = Object.keys(answersByPrevalence).filter(
        answer => answer !== winningAnswer
      )[0]
      if (answersByPrevalence[otherAnswer] === 1) {
        losingAnswer = otherAnswer
      }
    }

    Object.keys(this.gameState.answers).forEach(userId => {
      const playerState = this.getPlayerState(userId)
      answers[playerState!.joinOrder] = this.gameState.answers[userId]

      const earnedKoi = this.gameState.answers[userId] === winningAnswer
      if (earnedKoi) {
        const newKoi = playerState!.koi + 1
        this.setPlayerState(userId, {
          ...playerState!,
          koi: newKoi
        })
        koi[playerState!.joinOrder] = newKoi
      }

      if (this.gameState.answers[userId] === losingAnswer) {
        this.benigoiHolder = userId
        this.state.storage.put(BENIGOI_HOLDER, this.benigoiHolder)
      }
    })

    this.setGameState({ ...this.gameState, finalized: true })

    this.sendMessageToEveryClient({
      type: MessageToEveryClientType.ROUND_FINALIZED,
      payload: {
        answers,
        koi,
        benigoiHolder:
          this.benigoiHolder === undefined
            ? undefined
            : this.getPlayerState(this.benigoiHolder)!.joinOrder
      }
    })
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
              type: MessageToSingleClientType.ALL_PLAYERS_AND_GAME_STATE,
              payload: {
                you: you!,
                others,
                benigoiHolder:
                  this.benigoiHolder === undefined
                    ? undefined
                    : this.getPlayerState(this.benigoiHolder)!.joinOrder,
                questionIndex: this.questionOrder[this.gameState.questionIndex],
                deadline: this.gameState.deadline,
                answer: this.gameState.answers[userId]
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
            this.sendMessageToEveryClient({
              type: MessageToEveryClientType.EXISTING_PLAYER_NAME_UPDATE,
              payload: {
                joinOrder: playerState!.joinOrder,
                name: message.payload
              }
            })

            break
          }
          case MessageToServerType.ADVANCE_GAME_STATE: {
            const delta = SECONDS_PER_ROUND * 1000

            // this should always be true
            if (this.gameState.finalized) {
              this.setGameState({
                questionIndex: this.gameState.questionIndex + 1,
                deadline: Date.now() + delta,
                answers: {},
                finalized: false
              })

              this.sendMessageToEveryClient({
                type: MessageToEveryClientType.GAME_STATE_ADVANCED,
                payload: {
                  questionIndex: this.questionOrder[
                    this.gameState.questionIndex
                  ],
                  deadline: this.gameState.deadline
                }
              })

              // set timeout to finalize the next round
              const cachedQuestionIndex = this.gameState.questionIndex
              setTimeout(() => {
                if (
                  this.gameState.questionIndex === cachedQuestionIndex &&
                  !this.gameState.finalized
                ) {
                  this.finalizeRound()
                }
              }, delta)
            }

            break
          }
          case MessageToServerType.SUBMIT_ANSWER: {
            this.setGameState({
              ...this.gameState,
              answers: {
                ...this.gameState.answers,
                [userId]: message.payload
              }
            })

            const allAnswersSubmitted = Object.keys(this.webSockets).every(
              userId => this.gameState.answers[userId] !== undefined
            )

            if (allAnswersSubmitted && !this.gameState.finalized) {
              this.finalizeRound()
            }

            break
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
        koi: 0
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
