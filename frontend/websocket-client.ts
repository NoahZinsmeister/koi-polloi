export class WebsocketClient {
  private readonly webSocket: WebSocket

  constructor() {
    this.webSocket = new WebSocket('ws://localhost:8787/websocket')

    this.webSocket.addEventListener('message', (message) => {
      console.log(`client: ${message.data}`)
    })

    this.webSocket.addEventListener('open', () => {
      this.webSocket.send('test')
    })
  }
}
