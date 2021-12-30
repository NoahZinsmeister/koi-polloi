import { useEffect, useState } from 'react'

export const Deadline = ({
  deadline,
  finalized,
}: {
  deadline: number
  finalized: boolean
}) => {
  const [msLeft, setMsLeft] = useState(() => Math.max(deadline - Date.now(), 0))
  const minutesLeft = (msLeft - (msLeft % (60 * 1000))) / 1000
  const secondsLeft = Math.floor((msLeft % (60 * 1000)) / 1000)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now >= deadline) {
        setMsLeft(0)
        clearInterval(interval)
      } else {
        setMsLeft(deadline - now)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [deadline])

  return (
    <div>
      {finalized || msLeft === 0
        ? 'round over!'
        : `${minutesLeft}:${secondsLeft.toLocaleString(undefined, {
            minimumIntegerDigits: 2,
          })}`}
    </div>
  )
}
