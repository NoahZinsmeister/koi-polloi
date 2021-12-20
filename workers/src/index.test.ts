import 'isomorphic-fetch'

test('make sure test polyfills for fetch api work', () => {
  const url = 'http://workers.cloudflare.com/'
  const req = new Request(url)
  expect(req.url).toBe(url)
})
