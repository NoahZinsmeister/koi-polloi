import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import '../globals.css'
import { SessionStorageProviderProps } from '../local-storage'

const SessionStorageProviderWithNoSSR = dynamic<SessionStorageProviderProps>(
  () =>
    import('../local-storage').then(
      ({ SessionStorageProvider }) => SessionStorageProvider
    ),
  { ssr: false }
)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Koi Polloi</title>
        <meta name="description" content="A fishy party game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SessionStorageProviderWithNoSSR>
        <Component {...pageProps} />
      </SessionStorageProviderWithNoSSR>
    </>
  )
}

export default MyApp
