// StoryGallery.jsx — Latest 5 stories, single row + modal on click
import React, { useState, useEffect, useCallback } from 'react'
import { AccAddress, RESTClient } from '@initia/initia.js'

const MODULE_ADDR = 'init10qn8f96cjj64dqy5znu0s2a4ymh2t46shdwh4c'
const REST_URL    = import.meta.env.VITE_INITIA_REST_URL || 'http://localhost:1317'
const CHAIN_ID    = import.meta.env.VITE_APPCHAIN_ID     || 'initstory-1'
const rest        = new RESTClient(REST_URL, { chainId: CHAIN_ID })

function moduleHex() { return AccAddress.toHex(MODULE_ADDR) }

const GENRE_COLORS = {
  fantasy:   { bg: 'rgba(201,137,58,0.18)', border: 'rgba(201,137,58,0.35)', text: '#c9893a' },
  'sci-fi':  { bg: 'rgba(56,139,253,0.18)', border: 'rgba(56,139,253,0.35)', text: '#58a6ff' },
  adventure: { bg: 'rgba(63,185,80,0.18)',  border: 'rgba(63,185,80,0.35)',  text: '#3fb950' },
  mystery:   { bg: 'rgba(188,103,245,0.18)',border: 'rgba(188,103,245,0.35)',text: '#bc67f5' },
}

function StoryModal({ story, onClose }) {
  const gc = GENRE_COLORS[story.genre?.toLowerCase()] || GENRE_COLORS.fantasy
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(8,7,5,0.92)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#141210',
        border: '1px solid rgba(232,224,208,0.12)',
        borderRadius: '20px', maxWidth: '680px', width: '100%',
        maxHeight: '88vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.25s ease',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
      }}>
        {story.image_uri && (
          <div style={{ height: '280px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            <img src={story.image_uri} alt={story.prompt} referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, #141210 100%)',
            }} />
            <button onClick={onClose} style={{
              position: 'absolute', top: '14px', right: '14px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(20,18,14,0.8)',
              border: '1px solid rgba(232,224,208,0.15)',
              color: '#8a8070', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
            <span style={{
              position: 'absolute', bottom: '16px', left: '20px',
              padding: '3px 10px', borderRadius: '999px', fontSize: '11px',
              fontFamily: "'DM Mono', monospace",
              background: gc.bg, border: `1px solid ${gc.border}`, color: gc.text,
            }}>{story.genre}</span>
          </div>
        )}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: '10px',
            color: '#c9893a', letterSpacing: '0.12em', marginBottom: '10px',
          }}>STORY #{story.id + 1}</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.5rem', fontWeight: 700, fontStyle: 'italic',
            color: '#e8e0d0', margin: '0 0 16px', lineHeight: 1.3,
          }}>{story.prompt}</h2>
          <div style={{ height: '1px', background: 'rgba(232,224,208,0.08)', margin: '0 0 16px' }} />
          <p style={{
            color: '#bdb5a4', fontSize: '15px', lineHeight: 1.8,
            margin: 0, whiteSpace: 'pre-wrap',
          }}>{story.content || story.prompt}</p>
        </div>
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(232,224,208,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#4a4840' }}>
            Minted on initstory-1 · Move VM
          </span>
          <button onClick={onClose} style={{
            fontFamily: "'DM Mono', monospace", fontSize: '11px',
            color: '#8a8070', background: 'rgba(232,224,208,0.05)',
            border: '1px solid rgba(232,224,208,0.1)',
            borderRadius: '6px', padding: '6px 14px', cursor: 'pointer',
          }}>Close</button>
        </div>
      </div>
    </div>
  )
}

function StoryCard({ story, index, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const gc = GENRE_COLORS[story.genre?.toLowerCase()] || GENRE_COLORS.fantasy

  return (
    <div onClick={() => onClick(story)} style={{
      background: 'rgba(20,18,14,0.9)',
      border: '1px solid rgba(232,224,208,0.08)',
      borderRadius: '14px', overflow: 'hidden',
      cursor: 'pointer', flexShrink: 0, width: '200px',
      transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
      animation: `fadeUp 0.35s ease ${index * 0.07}s both`,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-5px)'
      e.currentTarget.style.borderColor = 'rgba(201,137,58,0.3)'
      e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.5)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.borderColor = 'rgba(232,224,208,0.08)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{ height: '160px', background: '#0a0906', position: 'relative', overflow: 'hidden' }}>
        {story.image_uri ? (
          <>
            {!imgLoaded && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: '2px solid rgba(201,137,58,0.2)', borderTopColor: '#c9893a',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            )}
            <img src={story.image_uri} alt={story.prompt} referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s ease',
              }} />
          </>
        ) : (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.8rem', color: 'rgba(201,137,58,0.12)',
          }}>✦</div>
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(20,18,14,0.9) 100%)',
        }} />
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          fontFamily: "'DM Mono', monospace", fontSize: '9px',
          color: 'rgba(201,137,58,0.6)', background: 'rgba(20,18,14,0.75)',
          padding: '2px 6px', borderRadius: '4px',
          border: '1px solid rgba(201,137,58,0.15)',
        }}>#{story.id + 1}</span>
        <div style={{
          position: 'absolute', bottom: '8px', right: '8px',
          fontFamily: "'DM Mono', monospace", fontSize: '9px',
          color: 'rgba(201,137,58,0.45)',
        }}>Read →</div>
      </div>
      <div style={{ padding: '12px' }}>
        <span style={{
          display: 'inline-block', marginBottom: '7px',
          padding: '2px 7px', borderRadius: '999px',
          fontSize: '9px', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em',
          background: gc.bg, border: `1px solid ${gc.border}`, color: gc.text,
        }}>{story.genre}</span>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '12px', color: '#c8b896',
          lineHeight: 1.4, margin: 0, fontStyle: 'italic',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{story.prompt}</p>
      </div>
    </div>
  )
}

export default function StoryGallery({ address }) {
  const [stories,  setStories]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  const fetchStories = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const tag = `${moduleHex()}::stories::Registry`
      const res = await rest.move.resource(address, tag)
      const raw = res.data?.stories || []
      const mapped = raw.map((s, i) => ({
        id: i, prompt: s.prompt || '', genre: s.genre || 'fantasy',
        image_uri: s.image_uri || '', content: s.content || s.prompt || '',
      }))
      setStories(mapped.slice(-5).reverse()) // last 5, newest first
    } catch { setStories([]) }
    finally { setLoading(false) }
  }, [address])

  useEffect(() => { fetchStories() }, [fetchStories])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1.5rem 0', color: '#5a5248' }}>
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%',
        border: '2px solid rgba(201,137,58,0.2)', borderTopColor: '#c9893a',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.08em' }}>
        Loading chronicles…
      </span>
    </div>
  )

  if (!stories.length) return (
    <div style={{
      padding: '1.5rem', textAlign: 'center',
      border: '1px dashed rgba(201,137,58,0.1)',
      borderRadius: '12px', color: '#4a4840',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>✦</div>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.06em' }}>
        No stories yet — write your first above!
      </p>
    </div>
  )

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '14px',
      }}>
        <div>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: '10px',
            color: '#c9893a', letterSpacing: '0.12em', display: 'block', marginBottom: '3px',
          }}>YOUR CHRONICLES</span>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.3rem', margin: 0, color: '#e8e0d0',
          }}>Latest {stories.length} {stories.length === 1 ? 'Story' : 'Stories'}</h3>
        </div>
        <button onClick={fetchStories} style={{
          fontFamily: "'DM Mono', monospace", fontSize: '11px',
          color: '#6a6258', background: 'rgba(232,224,208,0.04)',
          border: '1px solid rgba(232,224,208,0.08)',
          borderRadius: '6px', padding: '5px 11px', cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#c9893a' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#6a6258' }}
        >↻ Refresh</button>
      </div>

      {/* Single horizontal row */}
      <div style={{
        display: 'flex', gap: '14px',
        overflowX: 'auto', paddingBottom: '6px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(201,137,58,0.15) transparent',
      }}>
        {stories.map((story, i) => (
          <StoryCard key={story.id} story={story} index={i} onClick={setSelected} />
        ))}
      </div>

      {selected && <StoryModal story={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .modal-content {
          background: #1a1814;
          border: 1px solid #c9893a;
          border-radius: 12px;
          max-width: 700px;
          width: 90%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto; 
        }

        .full-story-text {
          color: #e8e0d0;
          line-height: 1.8;
          font-size: 1.1rem;
          white-space: pre-wrap;
          margin-top: 20px;
        }
        
        .modal-image-wrap img {
          width: 100%;
          border-radius: 8px;
          margin-bottom: 15px;
        }
      `}</style>
    </>
  )
}
