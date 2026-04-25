import React, { useState } from 'react'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { useInitStory } from './hooks/useInitStory.js'

// استيراد المكونات الجديدة التي أنشأناها
import ConnectPrompt from './components/ConnectPrompt.jsx'
import StoryGallery  from './components/StoryGallery.jsx'

// ─── الإعدادات ─────────────────────────────────────────────────────────────
const GENRES = [
  { id: 'fantasy',   label: 'Fantasy',   icon: '✦' },
  { id: 'sci-fi',    label: 'Sci-Fi',    icon: '◈' },
  { id: 'mystery',   label: 'Mystery',   icon: '◉' },
  { id: 'adventure', label: 'Adventure', icon: '◆' },
]

const LEVEL_NAMES = ['', 'Novice', 'Apprentice', 'Wanderer', 'Seeker',
                         'Adept', 'Champion', 'Veteran', 'Master', 'Legend', 'Mythic']

// ─── المكونات الفرعية الداخلية ──────────────────────────────────────────────

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
  const [phase,     setPhase]     = useState('idle')
  const [preview,   setPreview]   = useState(null)
  const [error,     setError]     = useState('')

  const { generateStory } = useInitStory()

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setPhase('generating')
    setError('')
    try {
      const result = await generateStory({ prompt: prompt.trim(), genre })
      setPreview({ ...result, cacheBuster: Date.now() }) 
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
      imageUri:    preview.image_url,
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
        >
          <span className="toggle-dot" />
          Auto-sign {isAutoSignEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {phase === 'idle' && (
        <>
          <textarea
            className="prompt-input"
            placeholder="Describe a scene…"
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
          <img 
            className="preview-img" 
            src={preview.image_url || preview.imageUri} 
            alt="Preview"
            referrerPolicy="no-referrer" 
          />
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

  // إذا لم يكن هناك محفظة متصلة، اعرض صفحة الـ Landing Page الجديدة
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

        {/* عرض المعرض فقط إذا كان هناك شخصية وعنوان محفظة */}
        {character && initiaAddress && (
          <div style={{ marginTop: '40px' }}>
             <StoryGallery address={initiaAddress} />
          </div>
        )}

        {!character ? (
          <CreateCharacterPanel onCreate={createCharacter} loading={txPending} />
        ) : (
          <div style={{ marginTop: '24px' }}>
            <StoryComposer
              character={character}
              onMint={mintStory}
              txPending={txPending}
              isAutoSignEnabled={isAutoSignEnabled}
              toggleAutoSign={toggleAutoSign}
            />
          </div>
        )}
      </main>
    </div>
  )
}