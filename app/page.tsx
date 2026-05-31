'use client'
import { useState } from 'react'
import VibeBlueprintCard from '@/components/VibeBlueprintCard'
import CommentGradingFeed from '@/components/CommentGradingFeed'
import VibeReport from '@/components/VibeReport'
import type { VibeBlueprint } from '@/lib/insforge'
import type { GradedComment, AuditAnalytics } from '@/lib/grader'

type Platform = 'youtube' | 'x'

const PLATFORM_META: Record<Platform, { label: string; icon: string; handle: string; title: string; url: string; color: string }> = {
  youtube: {
    label: 'YouTube',
    icon: '▶',
    handle: '@alexcreates',
    title: "I Almost Quit Creating. Here's What Stopped Me.",
    url: 'https://www.youtube.com/watch?v=example_burnout',
    color: 'bg-red-500',
  },
  x: {
    label: 'X / Twitter',
    icon: '𝕏',
    handle: '@jordanbuilds',
    title: 'Thread: On shipping in public and the cost nobody talks about',
    url: 'https://x.com/jordanbuilds/status/1234567890',
    color: 'bg-black',
  },
}

interface BlueprintState {
  contentItemId: string
  vibeBlueprint: VibeBlueprint
  creatorHandle: string
  title: string
  platform: Platform
  contentUrl: string
  isLive?: boolean
}

interface AuditState {
  gradedComments: GradedComment[]
  analytics: AuditAnalytics
  source: 'demo' | 'live'
}

export default function Home() {
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [blueprintState, setBlueprintState] = useState<BlueprintState | null>(null)
  const [auditState, setAuditState] = useState<AuditState | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [auditLoading, setAuditLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState('')

  async function runAudit(contentItemId: string) {
    setAuditLoading(true)
    setAuditState(null)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId }),
      })
      const data = await res.json()
      if (res.ok) {
        setAuditState({ gradedComments: data.gradedComments, analytics: data.analytics, source: data.source })
      }
    } catch {
      // audit failure is non-fatal — blueprint still shows
    } finally {
      setAuditLoading(false)
    }
  }

  async function loadBlueprint(p: Platform) {
    setPlatform(p)
    setBlueprintState(null)
    setAuditState(null)
    setError(null)
    setLoading(true)
    setLoadingMsg('Fetching transcript from Tigris → analyzing with HumaneBench principles...')
    try {
      const res = await fetch(`/api/blueprint?platform=${p}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to load blueprint')
        return
      }
      setBlueprintState({
        contentItemId: data.contentItemId,
        vibeBlueprint: data.vibeBlueprint,
        creatorHandle: PLATFORM_META[p].handle,
        title: PLATFORM_META[p].title,
        platform: p,
        contentUrl: PLATFORM_META[p].url,
      })
      setLoading(false)
      // kick off grading in parallel — blueprint shows immediately
      runAudit(data.contentItemId)
    } catch {
      setError('Network error — check the dev server logs')
    } finally {
      setLoading(false)
    }
  }

  async function ingestLiveUrl() {
    if (!liveUrl.trim()) return
    setBlueprintState(null)
    setAuditState(null)
    setError(null)
    setLoading(true)
    setLoadingMsg('Scraping via Apify → generating Vibe Blueprint → grading comments...')
    try {
      // /api/audit handles the full pipeline when given a url
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: liveUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Audit failed')
      } else {
        setPlatform(data.platform as Platform)
        setBlueprintState({
          contentItemId: data.contentItemId,
          vibeBlueprint: data.vibeBlueprint,
          creatorHandle: data.creatorHandle,
          title: data.title,
          platform: data.platform,
          contentUrl: data.contentUrl,
          isLive: true,
        })
        setAuditState({ gradedComments: data.gradedComments, analytics: data.analytics, source: data.source })
        setLiveUrl('')
      }
    } catch {
      setError('Network error — check the dev server logs')
    } finally {
      setLoading(false)
    }
  }

  const displayHandle = blueprintState?.creatorHandle ?? PLATFORM_META[platform].handle
  const displayTitle = blueprintState?.title ?? PLATFORM_META[platform].title
  const displayUrl = blueprintState?.contentUrl ?? PLATFORM_META[platform].url
  const displayIcon = PLATFORM_META[blueprintState?.platform ?? platform].icon
  const displayColor = PLATFORM_META[blueprintState?.platform ?? platform].color

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Syntropimaxx</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Social optimization sandboxes for human flourishing
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"></span>
            HumaneBench v3.0
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Live URL input */}
        <div className="rounded-xl border border-violet-800/60 bg-violet-950/40 px-5 py-4">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">
            Paste any creator link
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ingestLiveUrl()}
              placeholder="YouTube video: youtube.com/watch?v=...  ·  X post: x.com/user/status/..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={ingestLiveUrl}
              disabled={!liveUrl.trim() || loading}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-violet-500 transition-colors whitespace-nowrap"
            >
              Analyse
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Scraped via Apify · stored in Tigris · graded with HumaneBench v3.0
          </p>
        </div>

        {/* Demo quick-load */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Or load demo content
          </p>
          <div className="flex gap-3">
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
              const m = PLATFORM_META[p]
              const isActive = platform === p && blueprintState && !blueprintState.isLive
              return (
                <button
                  key={p}
                  onClick={() => loadBlueprint(p)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    isActive
                      ? 'border-violet-500 bg-violet-900/30 text-violet-300'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content info bar */}
        {(blueprintState || loading) && (
          <div className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className={`${displayColor} text-white text-sm w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0`}>
                {displayIcon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{displayTitle}</p>
                <p className="text-xs text-slate-500">
                  {displayHandle} ·{' '}
                  <a href={displayUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-400">
                    {displayUrl}
                  </a>
                  {blueprintState?.isLive && (
                    <span className="ml-2 inline-flex items-center gap-1 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                      Live via Apify
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Blueprint loading */}
        {loading && (
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-700 px-5 py-6">
            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-300">Generating Vibe Blueprint...</p>
              <p className="text-xs text-slate-500 mt-0.5">{loadingMsg}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-800 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Main grid: blueprint (left) + comment grading feed (right) */}
        {blueprintState && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VibeBlueprintCard
              blueprint={blueprintState.vibeBlueprint}
              creatorHandle={displayHandle}
              platform={blueprintState.platform}
            />
            <CommentGradingFeed
              comments={auditState?.gradedComments ?? []}
              source={auditState?.source}
              loading={auditLoading}
            />
          </div>
        )}

        {/* Analytics report — full width below grid */}
        {blueprintState && auditState && (
          <VibeReport
            analytics={auditState.analytics}
            creatorHandle={displayHandle}
          />
        )}

        {/* Empty state */}
        {!blueprintState && !loading && !error && (
          <div className="text-center py-16 text-slate-600">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-sm font-medium text-slate-500">
              Paste a creator link or select a demo above
            </p>
            <p className="text-xs mt-1">
              HumaneBench v3.0 grades every comment A–F across 8 principles
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-16 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>Syntropimaxx · Applied Intelligence Hackathon</span>
          <span>HumaneBench · Tigris · InsForge · Apify · Nebius</span>
        </div>
      </footer>
    </div>
  )
}
