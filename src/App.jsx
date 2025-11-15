import { useEffect, useMemo, useState } from 'react'

function App() {
  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  // Auth
  const [user, setUser] = useState(null) // {user_id, username}
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login') // or signup

  // Wallet
  const [wallet, setWallet] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [showWallet, setShowWallet] = useState(false)

  // Wager / Lobby
  const wagerOptions = [1, 5, 20]
  const [selectedWager, setSelectedWager] = useState(null)
  const [joining, setJoining] = useState(false)
  const [lobby, setLobby] = useState(null)

  // Leaderboard / Stats / Friends
  const [leaderboard, setLeaderboard] = useState([])
  const [period, setPeriod] = useState('all')
  const [stats, setStats] = useState({ players_in_game: 0, global_player_winnings_usd: 0 })
  const [friends, setFriends] = useState([])

  // UI
  const [showCustomize, setShowCustomize] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchLeaderboard(period)
  }, [period])

  useEffect(() => {
    if (user) {
      refreshWallet()
      fetchFriends()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${backend}/stats`)
      if (res.ok) setStats(await res.json())
    } catch {}
  }

  const fetchLeaderboard = async (p) => {
    try {
      const res = await fetch(`${backend}/leaderboard?period=${p}`)
      if (res.ok) setLeaderboard(await res.json())
    } catch {}
  }

  const fetchFriends = async () => {
    if (!user) return
    try {
      const res = await fetch(`${backend}/friends/${user.user_id}`)
      if (res.ok) setFriends(await res.json())
    } catch {}
  }

  const refreshWallet = async () => {
    if (!user) return
    try {
      setWalletLoading(true)
      const res = await fetch(`${backend}/wallet/${user.user_id}`)
      if (res.ok) {
        setWallet(await res.json())
      }
    } catch {} finally {
      setWalletLoading(false)
    }
  }

  const onWithdraw = async () => {
    if (!user) return
    const to = prompt('Enter destination SOL address (demo)')
    const amt = Number(prompt('Enter amount in SOL'))
    if (!to || !amt || isNaN(amt)) return
    try {
      setWalletLoading(true)
      const res = await fetch(`${backend}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, to_address: to, amount_sol: amt })
      })
      if (res.ok) {
        await refreshWallet()
        alert('Withdrawal initiated (demo)')
      } else {
        const e = await res.json().catch(() => ({}))
        alert(e.detail || 'Withdrawal failed')
      }
    } finally {
      setWalletLoading(false)
    }
  }

  const onJoinGame = async () => {
    if (!user) return setShowAuth(true)
    if (!selectedWager) return
    setJoining(true)
    try {
      const res = await fetch(`${backend}/lobby/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, wager_usd: selectedWager })
      })
      if (res.ok) {
        const data = await res.json()
        setLobby(data)
        if (data.status === 'started') {
          alert('Match started! (demo)')
        } else {
          alert(`Joined lobby (${data.players.length}/${data.max_players})`)
        }
      } else {
        const e = await res.json().catch(() => ({}))
        alert(e.detail || 'Unable to join lobby')
      }
    } finally {
      setJoining(false)
    }
  }

  const isLoggedIn = !!user

  const Header = () => (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-[#0b0f12]/80 backdrop-blur border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-gradient-to-br from-cyan-400 to-violet-500" />
        <span className="text-xl font-bold text-white">PaperPayout.io</span>
      </div>
      <nav className="flex items-center gap-6">
        <button onClick={() => setPeriod('all')} className={`text-sm ${period==='all'?'text-white':'text-white/60'} hover:text-white`}>Leaderboard</button>
        {!isLoggedIn ? (
          <button onClick={() => { setAuthMode('login'); setShowAuth(true) }} className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold">Login / Sign Up</button>
        ) : (
          <div className="relative">
            <details className="group">
              <summary className="list-none cursor-pointer px-4 py-2 rounded bg-white/10 hover:bg-white/15 text-white text-sm font-semibold">
                Welcome, {user.username}
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-[#0b0f12] border border-white/10 rounded shadow-lg p-2">
                <button onClick={() => setShowWallet(true)} className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-white/90 text-sm">My Wallet</button>
                <button onClick={() => { setUser(null); setWallet(null) }} className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-red-300 text-sm">Logout</button>
              </div>
            </details>
          </div>
        )}
      </nav>
    </header>
  )

  const GameArea = () => (
    <div className="w-full">
      <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
        <iframe
          title="Paper.io 2"
          src="https://paper-io.com/paper-io-2/" 
          className="w-full h-full"
          allow="fullscreen"
        />
      </div>
      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-white/80 text-sm mb-2">SELECT YOUR WAGER</h3>
        <div className="flex items-center gap-3">
          {wagerOptions.map(val => (
            <button
              key={val}
              onClick={() => setSelectedWager(val)}
              className={`px-4 py-2 rounded border ${selectedWager===val ? 'bg-cyan-500 text-white border-transparent' : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/15'}`}
            >
              ${val}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={onJoinGame}
            disabled={!selectedWager || joining}
            className={`px-6 py-3 rounded-lg font-semibold ${selectedWager ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-black' : 'bg-white/10 text-white/40'} disabled:opacity-60`}
          >
            {joining ? 'Joining...' : 'JOIN GAME'}
          </button>
        </div>
      </div>
    </div>
  )

  const LeftSidebar = () => (
    <aside className="w-full lg:w-72 space-y-4">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Top Players</h3>
          <a onClick={() => setPeriod('all')} className="text-xs text-cyan-300 hover:underline cursor-pointer">View Full Leaderboard</a>
        </div>
        <div className="space-y-2">
          {(leaderboard.slice(0,3)).map((p, idx) => (
            <div key={p.user_id+idx} className="flex items-center justify-between text-sm text-white/90">
              <span>{idx+1}. {p.username}</span>
              <span className="text-cyan-300">${Number(p.winnings_usd || 0).toLocaleString()}</span>
            </div>
          ))}
          {leaderboard.length===0 && (
            <p className="text-white/50 text-sm">No winners yet. Be the first!</p>
          )}
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          {['all','monthly','daily'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-2 py-1 rounded ${period===p?'bg-cyan-500 text-black':'bg-white/10 text-white/70'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Friends</h3>
          <button onClick={fetchFriends} className="text-xs text-white/70 hover:text-white">Refresh</button>
        </div>
        {isLoggedIn ? (
          <>
            <p className="text-xs text-white/60 mb-2">{friends.filter(f=>f.status==='ingame').length} Playing</p>
            <div className="space-y-2 max-h-60 overflow-auto pr-1">
              {friends.map(f => (
                <div key={f.user_id} className="flex items-center justify-between text-sm text-white/90">
                  <span>{f.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${f.status==='ingame'?'bg-violet-500/30 text-violet-200': f.status==='online'?'bg-cyan-500/30 text-cyan-200':'bg-white/10 text-white/60'}`}>{f.status}</span>
                </div>
              ))}
              {friends.length===0 && <p className="text-white/50 text-sm">No friends yet.</p>}
            </div>
            <button className="mt-3 w-full px-3 py-2 rounded bg-white/10 text-white/80 hover:bg-white/15">Add Friends</button>
          </>
        ) : (
          <p className="text-white/60 text-sm">Log in to see and add friends.</p>
        )}
      </div>
    </aside>
  )

  const RightSidebar = () => (
    <aside className="w-full lg:w-80 space-y-4">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-white font-semibold mb-3">Global Stats</h3>
        <div className="space-y-2 text-white/90 text-sm">
          <div className="flex justify-between"><span>Players In Game</span><span>{stats.players_in_game}</span></div>
          <div className="flex justify-between"><span>Global Player Winnings</span><span>${stats.global_player_winnings_usd.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">My Wallet</h3>
          {isLoggedIn && <button onClick={refreshWallet} className="text-xs text-white/70 hover:text-white">Refresh</button>}
        </div>
        {!isLoggedIn ? (
          <p className="text-white/60 text-sm">Log in to access your wallet.</p>
        ) : walletLoading ? (
          <p className="text-white/60 text-sm">Loading...</p>
        ) : wallet ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => navigator.clipboard.writeText(wallet.address)} className="px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/15 text-xs">Copy Address</button>
              <code className="text-white/60 truncate">{wallet.address}</code>
            </div>
            <div className="flex justify-between text-white/90"><span>USD</span><span>${Number(wallet.balance_usd||0).toFixed(2)}</span></div>
            <div className="flex justify-between text-white/90"><span>SOL</span><span>{Number(wallet.balance_sol||0).toFixed(4)} SOL</span></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => alert('Deposit via your unique address (demo)')} className="px-3 py-2 rounded bg-cyan-500 text-black font-semibold">Add Funds</button>
              <button onClick={onWithdraw} className="px-3 py-2 rounded bg-white/10 text-white/80 hover:bg-white/15">Cash Out</button>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-sm">No wallet found.</p>
        )}
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <button onClick={() => setShowCustomize(true)} className="w-full px-3 py-2 rounded bg-white/10 text-white/80 hover:bg-white/15">Customize Appearance</button>
        <a href="#" onClick={(e)=>e.preventDefault()} className="block w-full text-center px-3 py-2 rounded bg-violet-500/20 text-violet-200 hover:bg-violet-500/30">Join our Discord!</a>
        <a href="#" onClick={(e)=>e.preventDefault()} className="block text-center text-cyan-300 hover:underline text-sm">Manage Affiliate Program</a>
      </div>
    </aside>
  )

  const AuthModal = () => {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async () => {
      setLoading(true)
      try {
        if (authMode === 'login') {
          const res = await fetch(`${backend}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          if (res.ok) {
            const data = await res.json()
            setUser(data)
            setShowAuth(false)
          } else {
            const e = await res.json().catch(()=>({}))
            alert(e.detail || 'Login failed')
          }
        } else {
          const res = await fetch(`${backend}/auth/signup`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
          })
          if (res.ok) {
            const data = await res.json()
            setUser(data)
            setShowAuth(false)
          } else {
            const e = await res.json().catch(()=>({}))
            alert(e.detail || 'Sign up failed')
          }
        }
      } finally { setLoading(false) }
    }

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md rounded-xl bg-[#0b0f12] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">{authMode==='login'?'Login':'Sign Up'}</h3>
            <button onClick={()=>setShowAuth(false)} className="text-white/60 hover:text-white">✕</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/60">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
            </div>
            {authMode==='signup' && (
              <div>
                <label className="text-xs text-white/60">Username</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
              </div>
            )}
            <div>
              <label className="text-xs text-white/60">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
            </div>
            <button onClick={submit} disabled={loading} className="w-full px-4 py-2 rounded bg-cyan-500 text-black font-semibold disabled:opacity-60">{loading?'Please wait...': authMode==='login'?'Login':'Create Account'}</button>
            <button onClick={()=>setAuthMode(authMode==='login'?'signup':'login')} className="w-full px-4 py-2 rounded bg-white/10 text-white/80 hover:bg-white/15 text-sm">
              {authMode==='login' ? 'New here? Create an account' : 'Have an account? Log in'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const CustomizeModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg rounded-xl bg-[#0b0f12] border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Customize Appearance</h3>
          <button onClick={()=>setShowCustomize(false)} className="text-white/60 hover:text-white">✕</button>
        </div>
        <p className="text-white/70 text-sm">Theme and skin customization will go here. (Demo)</p>
      </div>
    </div>
  )

  const WalletModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-xl bg-[#0b0f12] border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">My Wallet</h3>
          <button onClick={()=>setShowWallet(false)} className="text-white/60 hover:text-white">✕</button>
        </div>
        {wallet ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => navigator.clipboard.writeText(wallet.address)} className="px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/15 text-xs">Copy Address</button>
              <code className="text-white/60 truncate">{wallet.address}</code>
            </div>
            <div className="flex justify-between text-white/90"><span>USD</span><span>${Number(wallet.balance_usd||0).toFixed(2)}</span></div>
            <div className="flex justify-between text-white/90"><span>SOL</span><span>{Number(wallet.balance_sol||0).toFixed(4)} SOL</span></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => alert('Deposit via your unique address (demo)')} className="px-3 py-2 rounded bg-cyan-500 text-black font-semibold">Add Funds</button>
              <button onClick={onWithdraw} className="px-3 py-2 rounded bg-white/10 text-white/80 hover:bg-white/15">Cash Out</button>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-sm">No wallet found.</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#070a0c] text-white">
      <Header />

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)_20rem] gap-4 lg:gap-6">
          <LeftSidebar />
          <GameArea />
          <RightSidebar />
        </div>
      </main>

      {showAuth && <AuthModal />}
      {showCustomize && <CustomizeModal />}
      {showWallet && <WalletModal />}
    </div>
  )
}

export default App
