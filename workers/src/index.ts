// In order for the workers runtime to find the class that implements
// our Durable Object namespace, we must export it from the root module.
export { KoiPolloi } from './koi-polloi'

interface Env {
  KOI_POLLOI: DurableObjectNamespace
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await handleRequest(request, env)
    } catch (e) {
      return new Response(`${e}`)
    }
  }
}

async function handleRequest(request: Request, env: Env) {
  let id = env.KOI_POLLOI.idFromName('A')
  let obj = env.KOI_POLLOI.get(id)
  let resp = await obj.fetch(request.url)
  let count = parseInt(await resp.text())
  let wasOdd = count % 2 ? 'is odd' : 'is even'

  return new Response(`${count} ${wasOdd}`)
}
