// useInitStory.js — custom hook for all on-chain interactions
import { useState, useEffect, useCallback } from 'react'
import { AccAddress, RESTClient } from '@initia/initia.js'
import { MsgExecute } from '@initia/initia.proto/initia/move/v1/tx'
import { useInterwovenKit } from '@initia/interwovenkit-react'

const CHAIN_ID     = import.meta.env.VITE_APPCHAIN_ID
const REST_URL     = import.meta.env.VITE_INITIA_REST_URL
const MODULE_ADDR  = import.meta.env.VITE_MODULE_ADDRESS   // bech32
const NATIVE_DENOM = import.meta.env.VITE_NATIVE_DENOM
const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const rest = new RESTClient(REST_URL, { chainId: CHAIN_ID })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function moduleHex() {
  return AccAddress.toHex(MODULE_ADDR)
}

export function useInitStory() {
  const { initiaAddress, openConnect, requestTxSync, autoSign } = useInterwovenKit()

  const [registry,   setRegistry]   = useState({ story_count: 0, character_count: 0 })
  const [character,  setCharacter]  = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [txPending,  setTxPending]  = useState(false)
  const [error,      setError]      = useState('')

  const isAutoSignEnabled = Boolean(autoSign?.isEnabledByChain?.[CHAIN_ID])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const sendTx = useCallback(async (functionName, args = []) => {
    if (!initiaAddress) { openConnect(); return null }
    setTxPending(true)
    setError('')
    try {
      const result = await requestTxSync({
        chainId:  CHAIN_ID,
        autoSign: isAutoSignEnabled,
        feeDenom: isAutoSignEnabled ? NATIVE_DENOM : undefined,
        messages: [{
          typeUrl: '/initia.move.v1.MsgExecute',
          value: MsgExecute.fromPartial({
            sender:       initiaAddress,
            moduleAddress: MODULE_ADDR,
            moduleName:   'stories',
            functionName,
            typeArgs:     [],
            args,
          }),
        }],
      })
      await sleep(2000)
      return result
    } catch (e) {
      setError(e?.message || 'Transaction failed')
      return null
    } finally {
      setTxPending(false)
    }
  }, [initiaAddress, isAutoSignEnabled, openConnect, requestTxSync])

  // ── On-chain reads ────────────────────────────────────────────────────────

  const fetchRegistry = useCallback(async (addr) => {
    if (!addr) return
    try {
      const tag = `${moduleHex()}::stories::Registry`
      const res = await rest.move.resource(addr, tag)
      setRegistry({
        story_count:     Number(res.data?.story_count     ?? 0),
        character_count: Number(res.data?.character_count ?? 0),
      })
    } catch {
      setRegistry({ story_count: 0, character_count: 0 })
    }
  }, [])

  const fetchCharacter = useCallback(async (addr) => {
    if (!addr) return
    try {
      const tag = `${moduleHex()}::stories::Character`
      const res = await rest.move.resource(addr, tag)
      setCharacter({
        id:          Number(res.data?.id          ?? 0),
        name:              res.data?.name         ?? '',
        genre:             res.data?.genre        ?? '',
        level:       Number(res.data?.level       ?? 1),
        story_count: Number(res.data?.story_count ?? 0),
        total_xp:    Number(res.data?.total_xp    ?? 0),
      })
    } catch {
      setCharacter(null)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    if (!initiaAddress) return
    await Promise.all([fetchRegistry(initiaAddress), fetchCharacter(initiaAddress)])
  }, [initiaAddress, fetchRegistry, fetchCharacter])

  useEffect(() => {
    refreshAll()
  }, [initiaAddress, refreshAll])

  // ── AI Generation (via backend) ───────────────────────────────────────────

  const generateStory = useCallback(async ({ prompt, genre }) => {
    const charName  = character?.name  ?? 'the hero'
    const charLevel = character?.level ?? 1
    const res = await fetch(`${BACKEND_URL}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt, genre, characterName: charName, characterLevel: charLevel }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Generation failed')
    return res.json()  // { content, title, imageUri }
  }, [character])

  // ── Public actions ────────────────────────────────────────────────────────

  const createCharacter = useCallback(async ({ name, genre }) => {
    // Encode string args as BCS-compatible hex
    const enc = (s) => {
      const bytes = new TextEncoder().encode(s)
      const len = new Uint8Array([bytes.length])
      const buf = new Uint8Array(len.length + bytes.length)
      buf.set(len, 0); buf.set(bytes, len.length)
      return Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('')
    }
    const result = await sendTx('create_character', [
      enc(name),
      enc(genre),
      MODULE_ADDR,   // deployer address — same as module owner
    ])
    if (result) await refreshAll()
    return result
  }, [sendTx, refreshAll])

  const mintStory = useCallback(async ({ prompt, content, imageUri, genre, blockHeight }) => {
    const enc = (s) => {
      const bytes = new TextEncoder().encode(s)
      const len = new Uint8Array([bytes.length])
      const buf = new Uint8Array(len.length + bytes.length)
      buf.set(len, 0); buf.set(bytes, len.length)
      return Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('')
    }
    const encU64 = (n) => {
      const buf = new ArrayBuffer(8)
      const view = new DataView(buf)
      view.setBigUint64(0, BigInt(n), true)
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
    }
    const result = await sendTx('mint_story', [
      enc(prompt),
      enc(content),
      enc(imageUri),
      enc(genre),
      encU64(0),           // character_id — always 0 for single character per wallet
      encU64(blockHeight || Date.now()),
      MODULE_ADDR,
    ])
    if (result) await refreshAll()
    return result
  }, [sendTx, refreshAll])

  // ── Auto-sign toggle ──────────────────────────────────────────────────────

  const toggleAutoSign = useCallback(async () => {
    if (!initiaAddress) { openConnect(); return }
    try {
      if (isAutoSignEnabled) {
        await autoSign?.disable(CHAIN_ID)
      } else {
        await autoSign?.enable(CHAIN_ID, { permissions: ['/initia.move.v1.MsgExecute'] })
      }
    } catch (e) {
      setError(e?.message || 'Auto-sign toggle failed')
    }
  }, [initiaAddress, isAutoSignEnabled, autoSign, openConnect])

  return {
    // state
    address: initiaAddress,
    registry,
    character,
    loading,
    txPending,
    error,
    isAutoSignEnabled,
    // actions
    createCharacter,
    mintStory,
    generateStory,
    toggleAutoSign,
    refreshAll,
    setError,
    openConnect,
  }
}
