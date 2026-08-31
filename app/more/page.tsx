'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown, Database, Gauge, SlidersHorizontal, Users } from 'lucide-react'
import { Card, Field, SectionLabel, inputClass } from '@/components/ui'
import { useData } from '@/hooks/useData'
import { percent } from '@/lib/format'
import type { RateLimitInfo, Show, TeamGroup } from '@/types/domain'

export default function MorePage() {
  const { data, mode, activeShowId, setActiveShowId, saveShow, savePricingRule, saveTeamGroup } =
    useData()

  return (
    <main className="space-y-3.5 px-3.5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <header className="px-1">
        <h1 className="text-xl font-black tracking-tight text-white">More</h1>
      </header>

      <ShowSection
        shows={data?.shows ?? []}
        activeShowId={activeShowId}
        setActiveShowId={setActiveShowId}
        saveShow={saveShow}
      />
      <GroupsSection data={data} saveTeamGroup={saveTeamGroup} />
      <RulesSection data={data} savePricingRule={savePricingRule} />
      <ApiSection />

      <Card>
        <div className="flex items-center gap-2.5">
          <Database size={18} className="text-ink-soft" />
          <div>
            <p className="text-[14px] font-bold text-ink">
              {mode === 'supabase' ? 'Supabase sync' : 'Local mode'}
            </p>
            <p className="text-[12px] font-medium text-ink-soft">
              {mode === 'supabase'
                ? 'Data syncs to your Supabase project with row-level security.'
                : 'Data is stored on this device. Add Supabase env vars to enable team sync + auth (see README).'}
            </p>
          </div>
        </div>
      </Card>
    </main>
  )
}

function ShowSection({
  shows,
  activeShowId,
  setActiveShowId,
  saveShow,
}: {
  shows: Show[]
  activeShowId: string | null
  setActiveShowId: (id: string | null) => void
  saveShow: (s: Show) => Promise<void>
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <CalendarDays size={16} className="text-ink-soft" />
        <SectionLabel>Show Mode</SectionLabel>
      </div>
      <select
        value={activeShowId ?? ''}
        onChange={(e) => setActiveShowId(e.target.value || null)}
        className={`${inputClass} appearance-none`}
      >
        <option value="">No show — general buying</option>
        {shows.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[12px] font-medium text-ink-soft">
        Every saved purchase is tagged with the active show.
      </p>

      {creating ? (
        <div className="mt-3 space-y-2.5">
          <Field label="Show name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Evansville Card Show" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="City">
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </Field>
            <Field label="State">
              <input value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <button
            disabled={!name.trim()}
            onClick={() => {
              const show: Show = {
                id: `show_${Date.now()}`,
                name: name.trim(),
                city: city.trim(),
                state: state.trim(),
                startDate: new Date().toISOString().slice(0, 10),
                endDate: null,
                createdAt: new Date().toISOString(),
              }
              void saveShow(show).then(() => {
                setActiveShowId(show.id)
                setCreating(false)
                setName('')
                setCity('')
                setState('')
              })
            }}
            className="w-full rounded-xl bg-ink py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            Create + activate
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-2.5 text-[13px] font-bold text-accent"
        >
          + New show
        </button>
      )}
    </Card>
  )
}

function GroupsSection({
  data,
  saveTeamGroup,
}: {
  data: ReturnType<typeof useData>['data']
  saveTeamGroup: (g: TeamGroup) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = data?.teamGroups.find((g) => g.id === editingId) ?? null

  return (
    <Card>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2">
          <Users size={16} className="text-ink-soft" />
          <SectionLabel>Team Groups</SectionLabel>
        </span>
        <ChevronDown size={16} className={`text-ink-soft ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && data && (
        <div className="mt-3 space-y-2">
          {data.teamGroups.map((g) => (
            <div key={g.id} className="rounded-xl bg-surface-muted px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-ink">{g.name}</p>
                <button
                  onClick={() => setEditingId(editingId === g.id ? null : g.id)}
                  className="text-[12px] font-bold text-accent"
                >
                  {editingId === g.id ? 'Done' : 'Edit teams'}
                </button>
              </div>
              {editingId === g.id && editing ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.teams.map((t) => {
                    const member = editing.teamIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        onClick={() =>
                          void saveTeamGroup({
                            ...editing,
                            teamIds: member
                              ? editing.teamIds.filter((id) => id !== t.id)
                              : [...editing.teamIds, t.id],
                          })
                        }
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          member ? 'bg-ink text-white' : 'bg-surface text-ink-soft'
                        }`}
                      >
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[12px] font-medium text-ink-soft">
                  {data.teams
                    .filter((t) => g.teamIds.includes(t.id))
                    .map((t) => t.name)
                    .join(' • ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function RulesSection({
  data,
  savePricingRule,
}: {
  data: ReturnType<typeof useData>['data']
  savePricingRule: ReturnType<typeof useData>['savePricingRule']
}) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-ink-soft" />
          <SectionLabel>Pricing Rules</SectionLabel>
        </span>
        <ChevronDown size={16} className={`text-ink-soft ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mt-3 space-y-2.5">
          {(data?.pricingRules ?? []).map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-bold text-ink">
                  {rule.name}{' '}
                  <span className="tnum text-[12px] font-bold text-negotiate">
                    {percent(rule.adjustmentValue, 0)}
                  </span>
                </p>
                <p className="text-[12px] font-medium text-ink-soft">{rule.description}</p>
              </div>
              <button
                role="switch"
                aria-checked={rule.active}
                onClick={() => void savePricingRule({ ...rule, active: !rule.active })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  rule.active ? 'bg-buy' : 'bg-line'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    rule.active ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function ApiSection() {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<RateLimitInfo | null>(null)

  useEffect(() => {
    if (!open) return
    void fetch('/api/admin/rate-limit')
      .then((r) => r.json())
      .then((b: { rateLimit: RateLimitInfo | null }) => setInfo(b.rateLimit))
      .catch(() => setInfo(null))
  }, [open])

  return (
    <Card>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2">
          <Gauge size={16} className="text-ink-soft" />
          <SectionLabel>Developer · API Usage</SectionLabel>
        </span>
        <ChevronDown size={16} className={`text-ink-soft ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3">
          {info ? (
            <>
              <p className="tnum text-2xl font-bold text-ink">
                {info.remaining ?? '—'}
                <span className="text-sm font-semibold text-ink-soft"> / {info.limit ?? '—'} requests remaining</span>
              </p>
              {info.reset && (
                <p className="text-[12px] font-medium text-ink-soft">
                  Resets {new Date(info.reset * 1000).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-[13px] font-medium text-ink-soft">
              No API usage recorded yet this server session — run a comp search first.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
