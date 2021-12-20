export class KoiPolloi {
  // webSockets: WebSocket[]
  state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
    // this.webSockets = []
  }

  async handleSession(webSocket: WebSocket) {
    webSocket.accept()
    // this.webSockets = [...this.webSockets, webSocket]

    webSocket.addEventListener('message', async (event: MessageEvent) => {
      webSocket.send(event.data)
    })

    const onCloseOrError = (event: CloseEvent | Event) => {
      console.log(event)
      // this.webSockets = this.webSockets.filter(
      //   otherWebSocket => otherWebSocket !== webSocket
      // )
    }

    webSocket.addEventListener('close', onCloseOrError)
    webSocket.addEventListener('error', onCloseOrError)
  }

  async fetch(request: Request) {
    const url = new URL(request.url)

    switch (url.pathname) {
      case '/websocket': {
        if (request.headers.get('Upgrade') !== 'websocket') {
          return new Response('Expected Upgrade: websocket', { status: 426 })
        }

        const ip = request.headers.get('CF-Connecting-IP')

        const { 0: client, 1: server } = new WebSocketPair()

        await this.handleSession(server)

        return new Response(null, { status: 101, webSocket: client })
      }
      default: {
        return new Response('Not found', { status: 404 })
      }
    }
  }
}
