import type { NextPage } from 'next'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { Container } from '../components/Container'

const Home: NextPage = () => {
  return (
    <Container>
      <h1 style={{ fontSize: '4rem' }}>koi polloi</h1>

      <Link href={`/${uuidv4()}`} passHref>
        <button>new game</button>
      </Link>
    </Container>
  )
}

export default Home
