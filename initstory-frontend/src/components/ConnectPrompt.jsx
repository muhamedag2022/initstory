// ConnectPrompt.jsx — Landing Page with single row of 6 story cards
import React, { useEffect, useState } from 'react'

const SAMPLE_STORIES = [
  {
    title: "The Whispering Woods",
    genre: "Fantasy",
    image: "https://image.pollinations.ai/prompt/enchanted%20forest%20glowing%20crystal%20fantasy%20art%20dark%20moody?width=400&height=300&nologo=true&nofeed=true&model=flux&seed=1001",
    excerpt: "Zara felt the ancient roots pulse beneath her boots, silver-veined leaves trembling without wind...",
  },
  {
    title: "Frozen Mountain Dragon",
    genre: "Sci-Fi",
    image: "https://image.pollinations.ai/prompt/lone%20astronaut%20crater%20mars%20sunset%20earth%20scifi?width=400&height=300&nologo=true&nofeed=true&model=flux&seed=2002",
    excerpt: "Her HUD pulsed: OXYGEN 64%. She'd been on the ice four hours, mag-boots slipping on black ice...",
  },
  {
    title: "The Pirate's Island",
    genre: "Adventure",
    image: "https://image.pollinations.ai/prompt/magical%20obsidian%20island%20violet%20nebula%20floating%20waterfalls?width=400&height=300&nologo=true&nofeed=true&model=flux&seed=3003",
    excerpt: "Before her hung an island of obsidian and silver, suspended in violet nebula gas...",
  },
  {
    title: "Glowing Desert Door",
    genre: "Mystery",
    image: "https://image.pollinations.ai/prompt/glowing%20ancient%20door%20desert%20amber%20mystical%20portal?width=400&height=300&nologo=true&nofeed=true&model=flux&seed=4004",
    excerpt: "The door pulsed with amber light. She pressed her palm to it. The desert held its breath...",
  },
  {
    title: "City of Mirrors",
    genre: "Sci-Fi",
    image: "https://image.pollinations.ai/prompt/futuristic%20city%20glass%20towers%20neon%20cyberpunk%20art?width=400&height=300&nologo=true&nofeed=true&model=flux&seed=5005",
    excerpt: "Every surface reflected a different version of the city. She chose the one where she survived...",
  },
  {
    title: "The Oracle's Warning",
    genre: "Fantasy",
    image: "https://image.pollinations.ai/prompt/dark%20oracle%20crystal%20ball%20ethereal%20magic%20glowing%20smoke?width=400&height=300&nologo=true&nofeed=true&model=flux&seed=6006",
    excerpt: "The crystal showed three futures. Only one had a tomorrow. She reached in and chose...",
  },
]

const GENRE_COLORS = {
  Fantasy:   { bg: 'rgba(201,137,58,0.15)', border: 'rgba(201,137,58,0.35)', text: '#c9893a' },
  'Sci-Fi':  { bg: 'rgba(56,139,253,0.15)', border: 'rgba(56,139,253,0.35)', text: '#58a6ff' },
  Adventure: { bg: 'rgba(63,185,80,0.15)',  border: 'rgba(63,185,80,0.35)',  text: '#3fb950' },
  Mystery:   { bg: 'rgba(188,103,245,0.15)',border: 'rgba(188,103,245,0.35)',text: '#bc67f5' },
}

function MiniCard({ story, index }) {
  const [loaded, setLoaded] = useState(false)
  const gc = GENRE_COLORS[story.genre] || GENRE_COLORS.Fantasy
  return (
    <div style={{
      background: 'rgba(18,16,12,0.95)',
      border: '1px solid rgba(232,224,208,0.08)',
      borderRadius: '12px', overflow: 'hidden',
      flex: '1 1 0', minWidth: 0,
      animation: `fadeUp 0.5s ease ${index * 0.08}s both`,
      transition: 'transform 0.2s, border-color 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.borderColor = 'rgba(201,137,58,0.25)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.borderColor = 'rgba(232,224,208,0.08)'
    }}
    >
      {/* Image */}
      <div style={{ height: '110px', background: '#0a0906', position: 'relative', overflow: 'hidden' }}>
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid rgba(201,137,58,0.15)',
              borderTopColor: 'rgba(201,137,58,0.5)',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}
        <img
          src={story.image} alt={story.title} loading="lazy" referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.4s',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(18,16,12,0.85) 100%)',
        }} />
      </div>

      {/* Text */}
      <div style={{ padding: '10px 12px' }}>
        <span style={{
          display: 'inline-block', marginBottom: '6px',
          padding: '2px 7px', borderRadius: '999px',
          fontSize: '9px', fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em',
          background: gc.bg, border: `1px solid ${gc.border}`, color: gc.text,
        }}>{story.genre}</span>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '12px', fontWeight: 700, color: '#c8b896',
          margin: '0 0 4px', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
        }}>{story.title}</p>
        <p style={{
          fontSize: '10px', color: '#5a5248', lineHeight: 1.4,
          margin: 0,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{story.excerpt}</p>
      </div>
    </div>
  )
}

export default function ConnectPrompt({ openConnect }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0906',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(201,137,58,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Hero */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '80px', paddingBottom: '48px',
        width: '100%',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {/* Logo glyph */}
        <div style={{
          fontSize: '2.2rem', color: '#c9893a', marginBottom: '18px',
          filter: 'drop-shadow(0 0 16px rgba(201,137,58,0.35))',
          animation: 'pulse 3s ease-in-out infinite',
        }}>✦</div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2.8rem, 7vw, 5rem)',
          fontWeight: 700, color: '#e8e0d0',
          letterSpacing: '-0.02em', lineHeight: 1,
          margin: '0 0 14px', textAlign: 'center',
        }}>
          Init<span style={{ color: '#c9893a' }}>Story</span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 'clamp(0.95rem, 2.2vw, 1.1rem)',
          color: '#7a7268', maxWidth: '440px',
          textAlign: 'center', lineHeight: 1.7,
          margin: '0 0 32px', padding: '0 24px',
          fontWeight: 300,
        }}>
          Write a prompt. Let AI craft your story.<br />
          Mint it on-chain. Watch your character evolve.
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '36px', marginBottom: '36px',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.7s ease 0.2s',
        }}>
          {[
            { value: '5+', label: 'Stories Minted' },
            { value: 'Move VM', label: 'Powered By' },
            { value: 'Auto-Sign', label: 'Zero Friction' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '12px', color: '#c9893a', fontWeight: 500,
              }}>{value}</div>
              <div style={{
                fontSize: '10px', color: '#3a3830',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.06em', marginTop: '2px',
              }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={openConnect}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px', fontWeight: 500,
            background: '#c9893a', color: '#0a0906',
            border: 'none', borderRadius: '8px',
            padding: '13px 36px', cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s',
            marginBottom: '10px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#e0a050'
            e.currentTarget.style.boxShadow = '0 0 24px rgba(201,137,58,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#c9893a'
            e.currentTarget.style.boxShadow = 'none'
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          Connect Wallet to Begin
        </button>

        <p style={{
          fontSize: '10px', color: '#2e2c28',
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.05em',
        }}>
          Powered by Initia · Move VM · DGrid AI
        </p>
      </div>

      {/* ── Single row of 6 story cards ── */}
      <div style={{
        width: '100%', maxWidth: '1100px',
        padding: '0 24px 60px',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.8s ease 0.4s',
      }}>
        {/* Section label */}
        <div style={{
          textAlign: 'center', marginBottom: '20px',
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: '10px',
            color: '#3a3830', letterSpacing: '0.12em',
          }}>STORIES FROM THE CHAIN</span>
        </div>

        {/* 6 cards in one row */}
        <div style={{
          display: 'flex', gap: '12px',
          // fade edges
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}>
          {SAMPLE_STORIES.map((story, i) => (
            <MiniCard key={i} story={story} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom label */}
      <div style={{
        paddingBottom: '28px',
        fontFamily: "'DM Mono', monospace",
        fontSize: '10px', color: '#1e1c18',
        letterSpacing: '0.12em',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.8s ease 0.6s',
      }}>
        INITIATE HACKATHON 2026 · AI & TOOLING TRACK
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
