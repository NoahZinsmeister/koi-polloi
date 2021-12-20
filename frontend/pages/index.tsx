import type { NextPage } from 'next'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Koi Polloi</h1>

        <Link href="/123">
          <a>Create Game</a>
        </Link>
      </main>
    </div>
  )
}

export default Home
