import type { NextPage } from 'next'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { Container } from '../components/Container'
import Image from 'next/image'


const Home: NextPage = () => {
  return (
    <Container>

      <div style = {{ paddingTop: '10rem', paddingBottom: '14rem' }}> 
      <div style = {{ display: 'flex', flexFlow: 'row wrap', alignItems: 'center'}}> 

        <div style = {{ display: 'block'}}>
        <Image src="/lily_with_flower.png" alt="koi" width="140" height="140" layout="intrinsic"/>
        </div>

        <h1 style={{ fontSize: '6rem', WebkitTextStroke: '2px black', lineHeight: '6rem', marginTop: '-2rem'}}>koi <Image src="/koi.png" alt="koi" width="140" height="140"/> <br></br> polloi </h1>

      </div>

      <div style = {{ display: 'flex', flexFlow: 'row wrap', justifyContent: 'space-around'}}>
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

    </div>

    <div style={{ padding: '2rem' }}>

      <h2>How to Play</h2>

      <em>hoi polloi</em>: (n.) the masses; the common people. (But now with kois! <Image src="/koi.png" alt="koi" width="20" height="20"/>) 

      <p>The goal of Koi Polloi is to guess what you think everyone else will be guessing. Koi Polloi is a game for 4-20 players.</p>

      <p>Each round, everyone will get see a question such as:</p>

      {/* insert card example */}

      <div style={{ backgroundColor: 'white', height: '8rem', width: '16rem', borderRadius: '.8rem', outline: '2px solid black', outlineOffset: '-5px'}}>

        <p style={{ color: 'black', padding: '3rem' }}>What is the worst household chore?</p>

      </div>

      <p>You have 60 seconds to give an answer. Don't answer what you would say, but what you think the majority of players in your group would say.</p>

      <p>Then we go around and see everyone's answers! Everyone who answered the most common answer gets 1 koi. <Image src="/koi.png" alt="koi" width="20" height="20"/> If you are the ONLY one who has the odd answer out, you will get the benigoi! <Image src="/benigoi.png" alt="benigoi" width="20" height="20"/></p>

      <p>It takes 8 kois <Image src="/koi.png" alt="koi" width="20" height="20"/>to win! However, if you have the benigoi <Image src="/benigoi.png" alt="benigoi" width="20" height="20"/>, you cannot win even if you have 8 koi <Image src="/koi.png" alt="koi" width="20" height="20"/>. If you and another player get to 8 kois <Image src="/koi.png" alt="koi" width="20" height="20"/> in the same round, the target to win increases by 1, so the first to 9 kois <Image src="/koi.png" alt="koi" width="20" height="20"/> wins. That keeps going until there is a winner!</p>

    </div>

    </Container>
  )
}

export default Home
