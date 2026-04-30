'use client'
import { useEffect, useState } from 'react'
import { getTeamByPin, getPlayers, upsertPlayer, deletePlayer } from '@/lib/supabase'
import type { Team, Player } from '@/lib/types'
import StarLogo from '@/components/StarLogo'

type Step = 'pin' | 'roster'

export default function DelegadoPage() {
  const [step, setStep] = useState<Step>('pin')
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState(false)
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)

  // Add/edit form
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formNumber, setFormNumber] = useState('')
  const [formErr, setFormErr] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handlePinSubmit() {
    setLoading(true)
    const t = await getTeamByPin(pin.trim())
    if (!t) {
      setPinErr(true)
      setPin('')
      setLoading(false)
      return
    }
    setTeam(t as Team)
    const p = await getPlayers(t.id)
    setPlayers(p as Player[])
    setStep('roster')
    setLoading(false)
  }

  async function handleSavePlayer() {
    if (!team) return
    setFormErr('')
    const num = parseInt(formNumber)
    if (!formName.trim()) { setFormErr('Ingresá el nombre'); return }
    if (!num || num < 1 || num > 99) { setFormErr('Número inválido (1-99)'); return }
    // Check duplicate number (excluding current edit)
    const dup = players.find((p) => p.shirt_number === num && p.id !== editId)
    if (dup) { setFormErr(`El #${num} ya está asignado a ${dup.name}`); return }

    setLoading(true)
    try {
      await upsertPlayer(team.id, formName.trim(), num, editId ?? undefined)
      const updated = await getPlayers(team.id)
      setPlayers(updated as Player[])
      resetForm()
    } catch (e: unknown) {
      setFormErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(playerId: string) {
    if (!confirm('¿Eliminar jugador?')) return
    setLoading(true)
    await deletePlayer(playerId)
    setPlayers((prev) => prev.filter((p) => p.id !== playerId))
    setLoading(false)
  }

  function startEdit(p: Player) {
    setEditId(p.id)
    setFormName(p.name)
    setFormNumber(String(p.shirt_number))
    setFormErr('')
    setShowForm(true)
  }

  function resetForm() {
    setEditId(null)
    setFormName('')
    setFormNumber('')
    setFormErr('')
    setShowForm(false)
  }

  // --- RENDER ---

  if (step === 'pin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-8">
        <StarLogo size={64} />
        <div className="text-center">
          <h1 className="text-xl font-black text-white">Panel Delegado</h1>
          <p className="text-xs text-gray-500 mt-1">Ingresá el PIN de tu equipo</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setPinErr(false) }}
          onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
          placeholder="PIN"
          className={`w-full max-w-[200px] bg-[#141414] border ${
            pinErr ? 'border-red-600' : 'border-[#2a2a2a]'
          } rounded-xl text-center text-2xl font-black text-white py-4 tracking-widest focus:outline-none focus:border-[#f5c518]`}
        />
        {pinErr && <p className="text-xs text-red-500">PIN incorrecto</p>}
        <p className="text-[10px] text-gray-700 text-center">
          Cada equipo tiene un PIN único.<br />Consultá a Rafa si no lo tenés.
        </p>
        <button
          onClick={handlePinSubmit}
          disabled={loading || !pin}
          className="w-full max-w-[200px] bg-[#f5c518] text-black font-black py-4 rounded-xl text-base active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? '...' : 'ENTRAR'}
        </button>
      </div>
    )
  }

  // ROSTER VIEW
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#222] px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Delegado · Zona {team?.zone}</p>
            <h1 className="text-lg font-black text-white">{team?.name}</h1>
            <p className="text-xs text-gray-500">{players.length} / 15 jugadores cargados</p>
          </div>
          <button
            onClick={() => setStep('pin')}
            className="text-gray-600 text-xs underline"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Player list */}
      <div className="p-4 space-y-2">
        {players.length === 0 && (
          <div className="text-center py-6 text-gray-600 text-sm">
            Aún no hay jugadores. Agregá tu plantel.
          </div>
        )}
        {[...players].sort((a, b) => a.shirt_number - b.shirt_number).map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 bg-[#141414] border border-[#1e1e1e] rounded-xl px-4 py-3"
          >
            <div className="w-9 h-9 rounded-full bg-[#1e1e1e] flex items-center justify-center text-sm font-black text-[#f5c518]">
              {p.shirt_number}
            </div>
            <span className="flex-1 text-sm font-bold text-white">{p.name}</span>
            <button
              onClick={() => startEdit(p)}
              className="text-gray-600 text-xs px-2 py-1 rounded border border-[#222]"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(p.id)}
              className="text-red-700 text-xs px-2 py-1 rounded border border-red-900"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add player button */}
      {!showForm && players.length < 15 && (
        <div className="px-4">
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-[#2a2a2a] rounded-xl py-4 text-sm text-gray-600 font-bold active:border-[#f5c518] active:text-[#f5c518] transition-colors"
          >
            + Agregar jugador
          </button>
        </div>
      )}

      {/* Add/edit form */}
      {showForm && (
        <div className="px-4 pb-24">
          <div className="bg-[#141414] border border-[#f5c518]/30 rounded-xl p-4 mt-2">
            <h3 className="text-sm font-black text-[#f5c518] mb-4">
              {editId ? 'Editar jugador' : 'Nuevo jugador'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Gonzalo Rossi"
                  className="w-full bg-[#0f0f0f] border border-[#222] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518]"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Número de camiseta</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="1 - 99"
                  min={1}
                  max={99}
                  className="w-full bg-[#0f0f0f] border border-[#222] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518]"
                />
              </div>
              {formErr && <p className="text-xs text-red-500">{formErr}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={resetForm}
                  className="flex-1 border border-[#222] text-gray-500 font-bold py-3 rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePlayer}
                  disabled={loading}
                  className="flex-1 bg-[#f5c518] text-black font-black py-3 rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-50"
                >
                  {loading ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
