'use client'
import { gradeStyle, type GradedComment } from '@/lib/grader'

const PRINCIPLE_SHORT: Record<string, string> = {
  respect_attention:    'Attn',
  meaningful_choices:   'Choice',
  enhance_capabilities: 'Growth',
  dignity_safety:       'Safety',
  healthy_relationships:'Bound',
  longterm_wellbeing:   'Well',
  transparency_honesty: 'Honest',
  equity_inclusion:     'Equity',
}

function PrincipleDots({ principles }: { principles: GradedComment['principles'] }) {
  return (
    <div className="flex gap-0.5 flex-wrap">
      {principles.map((p) => {
        const color =
          p.score >= 0.5 ? 'bg-green-500' :
          p.score >= 0   ? 'bg-amber-500' : 'bg-red-500'
        return (
          <span
            key={p.name}
            title={`${PRINCIPLE_SHORT[p.name] ?? p.name}: ${p.score > 0 ? '+' : ''}${p.score}`}
            className={`w-2 h-2 rounded-full ${color} opacity-80`}
          />
        )
      })}
    </div>
  )
}

interface Props {
  comments: GradedComment[]
  source?: 'demo' | 'live'
  loading?: boolean
}

export default function CommentGradingFeed({ comments, source, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-300">Grading comments with HumaneBench v3.0…</p>
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!comments.length) return null

  // Sort: violations first (for drama), then ascending score
  const sorted = [...comments].sort((a, b) => a.score - b.score)

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/60">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Vibe Audit
            <span className="text-slate-400 font-normal ml-1">// Existing Comment Grading Feed</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">HumaneBench v3.0 · 8 principles · A–F</p>
        </div>
        {source === 'demo' && (
          <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-800 px-2 py-0.5 rounded-full">
            Example set
          </span>
        )}
        {source === 'live' && (
          <span className="text-xs text-green-400 bg-green-900/30 border border-green-800 px-2 py-0.5 rounded-full">
            Live comments
          </span>
        )}
      </div>

      {/* Comment rows */}
      <div className="divide-y divide-slate-800">
        {sorted.map((c, i) => {
          const style = gradeStyle(c.grade)
          const isViolation = c.score < -0.1
          return (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 border-l-4 ${style.row} hover:bg-slate-800/40 transition-colors group`}
            >
              {/* Comment text + feedback */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${isViolation ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  &ldquo;{c.text}&rdquo;
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.feedback}</p>
                {c.globalViolations.length > 0 && (
                  <p className="text-xs text-red-400 mt-0.5">⚠ {c.globalViolations[0]}</p>
                )}
                <div className="mt-1.5">
                  <PrincipleDots principles={c.principles} />
                </div>
              </div>

              {/* Grade badge */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${style.badge} min-w-[52px] text-center tracking-wide`}>
                  {c.grade}
                </span>
                <span className="text-xs text-slate-600">
                  {c.score > 0 ? '+' : ''}{c.score.toFixed(2)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
