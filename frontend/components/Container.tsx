export const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        padding: '0 2rem',
      }}
    >
      <main
        style={{
          minHeight: '100vh',
          padding: '4rem 0',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
      </main>
    </div>
  )
}
