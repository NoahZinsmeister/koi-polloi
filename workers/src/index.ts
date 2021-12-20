// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { KoiPolloi } from './koi-polloi'

interface Env {
  KOI_POLLOI: DurableObjectNamespace
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const id = env.KOI_POLLOI.idFromName('A')
      const obj = env.KOI_POLLOI.get(id)

      return await obj.fetch(request)
    } catch (e) {
      return new Response(`${e}`)
    }
  }
}
