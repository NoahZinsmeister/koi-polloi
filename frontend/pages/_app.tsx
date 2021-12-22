import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import '../globals.css'
import { LocalStorageProviderProps } from '../local-storage'

const LocalStorageProviderWithNoSSR = dynamic<LocalStorageProviderProps>(
  () =>
    import('../local-storage').then(
      ({ LocalStorageProvider }) => LocalStorageProvider
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

      <LocalStorageProviderWithNoSSR>
        <Component {...pageProps} />
      </LocalStorageProviderWithNoSSR>
    </>
  )
}

export default MyApp
