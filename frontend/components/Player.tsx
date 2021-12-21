import { PlayerStorage } from '../../workers/src/koi-polloi'

export const Player = ({
  player,
}: {
  player?: PlayerStorage
}): JSX.Element | null => {
  if (!player) {
    return null
  }

  return (
    <div>
      <p>{player.name?.length ? player.name : `Player ${player.joinOrder}`}</p>
      <p>Koi: {player.koi}</p>
      <p>Benigoi: {player.benigoi}</p>
    </div>
  )
}
