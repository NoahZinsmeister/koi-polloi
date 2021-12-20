// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { KoiPolloi } from './koi-polloi'

interface Env {
  KOI_POLLOI: DurableObjectNamespace
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url)
      const params = new URLSearchParams(url.search)
      const gameId = params.get('gameId')
      if (!gameId) {
        return new Response('Missing gameId', { status: 400 })
      }

      const id = env.KOI_POLLOI.idFromName(gameId)
      const obj = env.KOI_POLLOI.get(id)

      return await obj.fetch(request)
    } catch (error) {
      console.error(error)
      return new Response('Unknown error', { status: 400 })
    }
  }
}
