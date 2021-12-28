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

const Score = ({ koi, benigoi }: { koi: number; benigoi: number }) => {
  return (
    <>
      <p>Koi: {koi}</p>
      <p style={{ marginBottom: 0 }}>Benigoi: {benigoi}</p>
    </>
  )
}

const sharedNameStyles = { fontSize: '1.25rem', fontWeight: 600 }

const placeholder = 'Your Name'

export const You = ({
  player,
  onNameUpdate,
  style,
}: {
  player?: PlayerState
  onNameUpdate: (name: string) => void
  style?: CardProps['style']
}) => {
  const serverName = player?.name
  const [localName, setLocalName] = useState<string>('')
  const displayName = localName || serverName || ''

  return (
    <Card style={style}>
      <input
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
      <Score koi={player?.koi ?? 0} benigoi={player?.benigoi ?? 0} />
    </Card>
  )
}

export const Other = ({
  player,
  style,
}: {
  player: PlayerState
  style?: CardProps['style']
}) => {
  return (
    <Card style={style}>
      <p style={{ ...sharedNameStyles, margin: 0 }}>
        {player.name || `Player ${player.joinOrder}`}
      </p>
      <Score koi={player?.koi ?? 0} benigoi={player?.benigoi ?? 0} />
    </Card>
  )
}
