// useInitStory.js — FIXED VERSION
// الحل: حذف deployer address من args — يتطلب تعديل stories.move أيضاً
import { useState, useEffect, useCallback } from 'react'
import { AccAddress, RESTClient } from '@initia/initia.js'
import { MsgExecute } from '@initia/initia.proto/initia/move/v1/tx'
import { useInterwovenKit } from '@initia/interwovenkit-react'

const CHAIN_ID     = import.meta.env.VITE_APPCHAIN_ID
const REST_URL     = import.meta.env.VITE_INITIA_REST_URL
const MODULE_ADDR  = import.meta.env.VITE_MODULE_ADDRESS
const NATIVE_DENOM = import.meta.env.VITE_NATIVE_DENOM
const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const rest  = new RESTClient(REST_URL, { chainId: CHAIN_ID })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function moduleHex() {
  if (MODULE_ADDR?.startsWith('0x')) return MODULE_ADDR
  return AccAddress.toHex(MODULE_ADDR)
}

// BCS string encoding: length (ULEB128) + bytes
function enc(s) {
  const bytes = new TextEncoder().encode(s)
  const uleb = []
  let len = bytes.length
  do {
    let b = len & 0x7f
    len >>= 7
    if (len > 0) b |= 0x80
    uleb.push(b)
  } while (len > 0)
  const result = new Uint8Array(uleb.length + bytes.length)
  result.set(uleb, 0)
  result.set(bytes, uleb.length)
  return result
}

// BCS u64 encoding: little-endian 8 bytes
function encU64(n) {
  const buf  = new ArrayBuffer(8)
  const view = new DataView(buf)
  view.setBigUint64(0, BigInt(n), true)
  return new Uint8Array(buf)
}

export function useInitStory() {
  const { initiaAddress, openConnect, requestTxSync, autoSign } = useInterwovenKit()

  const [registry,  setRegistry]  = useState({ story_count: 0, character_count: 0 })
  const [character, setCharacter] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [error,     setError]     = useState('')

  const isAutoSignEnabled = Boolean(autoSign?.isEnabledByChain?.[CHAIN_ID])

  // ── Core TX sender ────────────────────────────────────────────────────────
  const sendTx = useCallback(async (functionName, args = []) => {
    if (!initiaAddress) { openConnect(); return null }
    setTxPending(true)
    setError('')
    try {
      const result = await requestTxSync({
        chainId:  CHAIN_ID,
        messages: [{
          typeUrl: '/initia.move.v1.MsgExecute',
          value: MsgExecute.fromPartial({
            sender:        initiaAddress,
            moduleAddress: MODULE_ADDR,
            moduleName:    'stories',
            functionName,
            typeArgs:      [],
            args,
          }),
        }],
        gas:  '400000',
        fees: [{ denom: 'uinit', amount: '200000' }],
      })
      await sleep(2000)
      return result
    } catch (e) {
      const rawMessage = e?.message || 'Transaction failed'
      const lower = String(rawMessage).toLowerCase()
      if (
        lower.includes('already exists') ||
        lower.includes('already_exists') ||
        lower.includes('e_character_already_exists')
      ) {
        setError('Character already exists for this wallet.')
      } else {
        setError(rawMessage)
      }
      return null
    } finally {
      setTxPending(false)
    }
  }, [initiaAddress, requestTxSync, openConnect])

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

  useEffect(() => { refreshAll() }, [initiaAddress, refreshAll])

  // ── AI Generation ─────────────────────────────────────────────────────────
  const generateStory = useCallback(async ({ prompt, genre }) => {
    const charName  = character?.name  ?? 'the hero'
    const charLevel = character?.level ?? 1
    const res = await fetch(`${BACKEND_URL}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt, genre, characterName: charName, characterLevel: charLevel }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Generation failed')
    return res.json()
  }, [character])

  // ── Public Actions ────────────────────────────────────────────────────────

  // ✅ FIXED: لا deployer address — يتطلب تعديل stories.move أيضاً
  const createCharacter = useCallback(async ({ name, genre }) => {
    const result = await sendTx('create_character', [
      enc(name),
      enc(genre),
      // ✅ لا deployer address هنا — يجب تعديل stories.move أيضاً
    ])
    if (result) await refreshAll()
    return result
  }, [sendTx, refreshAll])

  const mintStory = useCallback(async ({ prompt, content, imageUri, genre, blockHeight }) => {
    const result = await sendTx('mint_story', [
      enc(prompt),
      enc(content),
      enc(imageUri),
      enc(genre),
      encU64(0),
      encU64(blockHeight || Math.floor(Date.now() / 1000)),
      // ✅ لا deployer address هنا — يجب تعديل stories.move أيضاً
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
    address: initiaAddress,
    registry, character, loading, txPending, error, isAutoSignEnabled,
    createCharacter, mintStory, generateStory, toggleAutoSign,
    refreshAll, setError, openConnect,
  }
}