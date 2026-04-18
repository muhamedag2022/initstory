import React, { useState } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { useInitStory } from './hooks/useInitStory.js'

// ─── Genre config ─────────────────────────────────────────────────────────────
const GENRES = [
  { id: 'fantasy',   label: 'Fantasy',   icon: '✦' },
  { id: 'sci-fi',    label: 'Sci-Fi',    icon: '◈' },
  { id: 'mystery',   label: 'Mystery',   icon: '◉' },
  { id: 'adventure', label: 'Adventure', icon: '◆' },
]

const LEVEL_NAMES = ['', 'Novice', 'Apprentice', 'Wanderer', 'Seeker',
                         'Adept', 'Champion', 'Veteran', 'Master', 'Legend', 'Mythic']

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConnectPrompt({ openConnect }) {
  return (
    <div className="connect-prompt">
      <div className="connect-inner">
        <div className="logo-glyph">✦</div>
        <h1>InitStory</h1>
        <p>Write a prompt. Claim your story as an on-chain NFT. Watch your character evolve.</p>
        <button className="btn-primary" onClick={openConnect}>Connect Wallet</button>
      </div>
    </div>
  )
}

function CreateCharacterPanel({ onCreate, loading }) {
  const [name,  setName]  = useState('')
  const [genre, setGenre] = useState('fantasy')

  const handle = async () => {
    if (!name.trim()) return
    await onCreate({ name: name.trim(), genre })
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-tag">STEP 1</span>
        <h2>Create Your Character</h2>
        <p>Your character evolves with every story you mint.</p>
      </div>
      <div className="field-group">
        <input
          className="input-field"
          placeholder="Character name (e.g. Zara)"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={40}
        />
        <div className="genre-grid">
          {GENRES.map(g => (
            <button
              key={g.id}
              className={`genre-btn ${genre === g.id ? 'active' : ''}`}
              onClick={() => setGenre(g.id)}
            >
              <span className="genre-icon">{g.icon}</span>
              {g.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={handle} disabled={loading || !name.trim()}>
          {loading ? 'Creating…' : 'Create Character →'}
        </button>
      </div>
    </div>
  )
}

function CharacterCard({ character }) {
  const lvl  = character.level
  const name = LEVEL_NAMES[Math.min(lvl, 10)]
  const xpForNext = (lvl * 3 * 10)
  const pct  = Math.min(100, Math.round((character.total_xp / xpForNext) * 100))

  return (
    <div className="char-card">
      <div className="char-avatar">
        <span>{character.name.charAt(0).toUpperCase()}</span>
        <div className="char-level">Lv {lvl}</div>
      </div>
      <div className="char-info">
        <div className="char-name">{character.name}</div>
        <div className="char-rank">{name} · {character.genre}</div>
        <div className="xp-bar-wrap">
          <div className="xp-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="char-stats">
          <span>{character.story_count} stories</span>
          <span>{character.total_xp} XP</span>
        </div>
      </div>
    </div>
  )
}

function StoryComposer({ character, onMint, txPending, isAutoSignEnabled, toggleAutoSign }) {
  const [prompt,    setPrompt]    = useState('')
  const [genre,     setGenre]     = useState(character?.genre || 'fantasy')
  const [phase,     setPhase]     = useState('idle')   // idle | generating | confirming | done
  const [preview,   setPreview]   = useState(null)     // { title, content, imageUri }
  const [error,     setError]     = useState('')

  const { generateStory } = useInitStory()

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setPhase('generating')
    setError('')
    try {
      const result = await generateStory({ prompt: prompt.trim(), genre })
      setPreview(result)
      setPhase('confirming')
    } catch (e) {
      setError(e.message || 'Generation failed')
      setPhase('idle')
    }
  }

  const handleMint = async () => {
    if (!preview) return
    setPhase('minting')
    const result = await onMint({
      prompt:      prompt.trim(),
      content:     preview.content,
      imageUri:    preview.imageUri,
      genre,
      blockHeight: Math.floor(Date.now() / 1000),
    })
    if (result) {
      setPhase('done')
      setPrompt('')
      setTimeout(() => { setPhase('idle'); setPreview(null) }, 3000)
    } else {
      setPhase('confirming')
    }
  }

  const reset = () => { setPhase('idle'); setPreview(null); setError('') }

  return (
    <div className="composer">
      <div className="composer-header">
        <div>
          <span className="panel-tag">STEP 2</span>
          <h2>Write a Story</h2>
        </div>
        <button
          className={`autosign-toggle ${isAutoSignEnabled ? 'on' : ''}`}
          onClick={toggleAutoSign}
          title="Auto-signing lets you mint without wallet popups"
        >
          <span className="toggle-dot" />
          Auto-sign {isAutoSignEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {phase === 'idle' && (
        <>
          <textarea
            className="prompt-input"
            placeholder="Describe a scene… (e.g. A lone traveler finds a door of light in the desert)"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            maxLength={280}
            rows={3}
          />
          <div className="composer-footer">
            <div className="genre-grid small">
              {GENRES.map(g => (
                <button key={g.id} className={`genre-btn ${genre === g.id ? 'active' : ''}`} onClick={() => setGenre(g.id)}>
                  <span className="genre-icon">{g.icon}</span>{g.label}
                </button>
              ))}
            </div>
            <div className="composer-actions">
              <span className="char-count">{prompt.length}/280</span>
              <button className="btn-primary" onClick={handleGenerate} disabled={!prompt.trim()}>
                Generate Story →
              </button>
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
        </>
      )}

      {phase === 'generating' && (
        <div className="generation-loader">
          <div className="loader-ring" />
          <p>AI is weaving your story…</p>
        </div>
      )}

      {(phase === 'confirming' || phase === 'minting') && preview && (
        <div className="preview-panel">
          {preview.imageUri && (
            <img className="preview-img" src={preview.imageUri} alt={preview.title} />
          )}
          <h3 className="preview-title">{preview.title}</h3>
          <p className="preview-content">{preview.content}</p>
          <div className="preview-actions">
            <button className="btn-ghost" onClick={reset} disabled={phase === 'minting'}>← Rewrite</button>
            <button className="btn-primary" onClick={handleMint} disabled={phase === 'minting' || txPending}>
              {phase === 'minting' ? 'Minting…' : `Mint as NFT ${isAutoSignEnabled ? '(auto)' : ''}`}
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="done-state">
          <div className="done-glyph">✦</div>
          <p>Story minted! Your character gained XP.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { initiaAddress, openConnect, openWallet } = useInterwovenKit()
  const {
    registry, character, txPending,
    createCharacter, mintStory,
    isAutoSignEnabled, toggleAutoSign,
    error,
  } = useInitStory()

  const short = (a) => a ? `${a.slice(0,8)}…${a.slice(-4)}` : ''

  if (!initiaAddress) return <ConnectPrompt openConnect={openConnect} />

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">✦ InitStory</div>
        <div className="header-right">
          {registry.story_count > 0 && (
            <span className="header-stat">{registry.story_count} stories minted</span>
          )}
          <button className="btn-wallet" onClick={openWallet}>{short(initiaAddress)}</button>
        </div>
      </header>

      <main className="app-main">
        {error && <div className="global-error">{error}</div>}

        {character && <CharacterCard character={character} />}

        {!character ? (
          <CreateCharacterPanel onCreate={createCharacter} loading={txPending} />
        ) : (
          <StoryComposer
            character={character}
            onMint={mintStory}
            txPending={txPending}
            isAutoSignEnabled={isAutoSignEnabled}
            toggleAutoSign={toggleAutoSign}
          />
        )}
      </main>
    </div>
  )
}
