export class WebsocketClient {
  private readonly webSocket: WebSocket

  constructor() {
    this.webSocket = new WebSocket(`wss://echo.websocket.events`)

    this.webSocket.addEventListener('message', (message) => {
      console.log(`client: ${message.data}`)
    })

    this.webSocket.addEventListener('open', () => {
      this.webSocket.send('test')
    })
  }
}
