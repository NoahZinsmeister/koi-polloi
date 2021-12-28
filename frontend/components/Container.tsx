export const Container = ({
  children,
  centered,
}: {
  children: React.ReactNode
  centered?: boolean
}) => {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: centered ?? true ? 'center' : 'flex-start',
        alignItems: centered ?? true ? 'center' : 'flex-start',
      }}
    >
      {children}
    </main>
  )
}
