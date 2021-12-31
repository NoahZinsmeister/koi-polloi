import { useState } from 'react'
import { PlayerState } from '../../workers/src/koi-polloi'

interface CardProps {
  children: React.ReactNode
  style?: React.HTMLAttributes<HTMLDivElement>['style']
}

const Card = ({ children, style }: CardProps) => {
  return (
    <div
      style={{
        ...style,
        width: 'fit-content',
        minWidth: '10rem',
        padding: '1rem',
        borderRadius: '1rem',
        border: '1px solid',
      }}
    >
      {children}
    </div>
  )
}

const Score = ({ koi, benigoi }: { koi: number; benigoi: boolean }) => {
  if (benigoi) {
    return (
      <>
        <p>koi: {koi}</p>
        <p style={{ marginBottom: 0 }}>has the benigoi!</p>
      </>
    )
  } else {
    return <p style={{ marginBottom: 0 }}>koi: {koi}</p>
  }
}

const sharedNameStyles = { fontSize: '1.25rem', fontWeight: 600 }

const placeholder = 'Your Name'

export const You = ({
  player,
  benigoiHolder,
  onNameUpdate,
  style,
}: {
  player?: PlayerState
  benigoiHolder: number | undefined
  onNameUpdate: (name: string) => void
  style?: CardProps['style']
}) => {
  const serverName = player?.name
  const [localName, setLocalName] = useState<string>('')
  const displayName = localName || serverName || ''

  return (
    <Card style={style}>
      <input
        type="text"
        style={{
          ...sharedNameStyles,
          borderWidth: 0,
          borderBottomWidth: 'thin',
        }}
        placeholder={placeholder}
        spellCheck={false}
        value={displayName}
        size={displayName.length || placeholder.length}
        onChange={(e) => {
          onNameUpdate(e.target.value)
          setLocalName(e.target.value)
        }}
      />
      <Score
        koi={player?.koi ?? 0}
        benigoi={
          benigoiHolder !== undefined && player?.joinOrder === benigoiHolder
        }
      />
    </Card>
  )
}

export const Other = ({
  player,
  benigoiHolder,
  style,
}: {
  player: PlayerState
  benigoiHolder: number | undefined
  style?: CardProps['style']
}) => {
  return (
    <Card style={style}>
      <p style={{ ...sharedNameStyles, margin: 0 }}>
        {player.name || `Player ${player.joinOrder}`}
      </p>
      <Score
        koi={player?.koi ?? 0}
        benigoi={
          benigoiHolder !== undefined && player?.joinOrder === benigoiHolder
        }
      />
    </Card>
  )
}
