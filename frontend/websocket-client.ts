export class WebsocketClient {
  private readonly webSocket: WebSocket
  private readonly open: Promise<void>

  constructor(gameId: string) {
    this.webSocket = new WebSocket(
      `ws://${process.env.NEXT_PUBLIC_URL}/websocket?gameId=${gameId}`
    )

    this.open = new Promise((resolve) => {
      this.webSocket.addEventListener('open', () => {
        resolve()
      })
    })

    this.webSocket.addEventListener('message', (message) => {
      console.log(`client: ${message.data}`)
    })
  }

  async send(message: string) {
    await this.open
    this.webSocket.send(message)
  }

  close() {
    this.webSocket.close()
  }
}
