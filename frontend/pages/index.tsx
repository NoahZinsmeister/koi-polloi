import type { NextPage } from 'next'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { Container } from '../components/Container'
import Image from 'next/image'


const Home: NextPage = () => {
  return (
    <Container>

      <div style = {{ display: 'flex', flexFlow: 'row wrap', alignItems: 'center'}}> 

        <div style = {{ display: 'block'}}>
        <Image src="/lily_with_flower.png" alt="koi" width="140" height="140" layout="intrinsic"/>
        </div>

        <h1 style={{ fontSize: '6rem', WebkitTextStroke: '2px black', lineHeight: '6rem', marginTop: '-2rem'}}>koi <Image src="/koi.png" alt="koi" width="140" height="140"/> <br></br> polloi </h1>

      </div>

      <div style = {{ display: 'flex', flexFlow: 'row wrap' }}>
      {/* create game button */}
      <Link href={`/${uuidv4()}`} passHref>
        <div style={{ position: 'relative', textAlign: 'center'}}>
        <Image src="/rock_2.png" alt="create game rock" width="140" height="40"/>
        <p style={{ position: 'absolute', top: '-15%', left: '15%', color: 'black', fontSize: '1rem'}}>create game</p>
        </div>
      </Link>

      {/* join game button */}
      <Link href={`/${uuidv4()}`} passHref>
        <div style={{ position: 'relative', textAlign: 'center'}}>
        <Image src="/rock_1.png" alt="join game rock" width="140" height="40"/>
        <p style={{ position: 'absolute', top: '-15%', left: '25%', color: 'black', fontSize: '1rem'}}>join game</p>
        </div>
      </Link>
      </div>

    </Container>
  )
}

export default Home
