import type { NextPage } from 'next'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { Container } from '../components/Container'

const Home: NextPage = () => {
  return (
    <Container>
      <h1>Koi Polloi</h1>

      <Link href={`/${uuidv4()}`}>
        <a>Create New Game</a>
      </Link>
    </Container>
  )
}

export default Home
