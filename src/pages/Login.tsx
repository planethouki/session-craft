import { useAuth } from "../auth";

export default function LoginScreen({ debug }: { debug?: string}) {
  const { loginWithLiff, error, liffReady } = useAuth()
  return (
    <div style={{ padding: 24 }}>
      <h2>Session Craft</h2>
      {debug && <p>debug: {debug}</p>}
      <p>LINEでログインしてください。</p>
      <button onClick={loginWithLiff} disabled={!liffReady}>
        {liffReady ? 'LINEでログイン' : '初期化中...'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
