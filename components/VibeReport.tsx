'use client'
import type { AuditAnalytics } from '@/lib/grader'
import { gradeStyle } from '@/lib/grader'

const GRADE_ORDER = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C-', 'D', 'F']

interface Props {
  analytics: AuditAnalytics
  creatorHandle: string
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-black text-white leading-none">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}

export default function VibeReport({ analytics, creatorHandle }: Props) {
  const { communityAlignmentPct, tierDepth, depthVectorPct, gradeDistribution, totalGraded } = analytics
  const tierStyle = gradeStyle(tierDepth)

  const alignmentLabel =
    communityAlignmentPct >= 75 ? 'Positive Growth' :
    communityAlignmentPct >= 50 ? 'Neutral Engagement' : 'High Toxicity Risk'

  const depthLabel =
    depthVectorPct >= 60 ? 'High Engagement Depth' :
    depthVectorPct >= 30 ? 'Mixed Quality' : 'Low Signal Ratio'

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/60">
        <h3 className="text-sm font-semibold text-white">
          Vibe Report
          <span className="text-slate-400 font-normal ml-1">// Monetizable Retention State</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{creatorHandle} · {totalGraded} comments graded</p>
      </div>

      <div className="p-4 space-y-4">
        {/* 3 stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="True Audience Sentiment"
            value={`${communityAlignmentPct}%`}
            sub={alignmentLabel}
            accent="bg-slate-800 border-slate-700"
          />
          <Stat
            label="Community Signal Score"
            value={tierDepth}
            sub="Tier Depth"
            accent={`bg-slate-800 border-slate-700`}
          />
          <Stat
            label="High-Signal Ratio"
            value={`${depthVectorPct}%`}
            sub={depthLabel}
            accent="bg-slate-800 border-slate-700"
          />
        </div>

        {/* Grade distribution bar */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Grade Distribution
          </p>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
            {GRADE_ORDER.map((grade) => {
              const count = gradeDistribution[grade] ?? 0
              if (count === 0) return null
              const pct = Math.round((count / totalGraded) * 100)
              const style = gradeStyle(grade)
              return (
                <div
                  key={grade}
                  title={`${grade}: ${count} (${pct}%)`}
                  className={`flex items-center justify-center text-[10px] font-bold text-white ${style.badge.replace('text-white', '')} transition-all`}
                  style={{ width: `${pct}%`, minWidth: pct > 0 ? '28px' : '0' }}
                >
                  {pct >= 10 ? grade : ''}
                </div>
              )
            })}
          </div>
          <div className="flex gap-1 flex-wrap mt-2">
            {GRADE_ORDER.map((grade) => {
              const count = gradeDistribution[grade] ?? 0
              if (count === 0) return null
              const style = gradeStyle(grade)
              return (
                <span key={grade} className="text-xs text-slate-400">
                  <span className={`inline-block w-2 h-2 rounded-sm mr-1 ${style.dot}`} />
                  {grade} ({count})
                </span>
              )
            })}
          </div>
        </div>

        {/* What this means */}
        <div className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-3">
          <p className="text-xs font-semibold text-slate-300 mb-1">Recommended Action</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {depthVectorPct >= 50
              ? `${depthVectorPct}% of your audience is delivering high-signal engagement. Pin the A-grade comments to surface genuine community voice and attract similar contributors.`
              : communityAlignmentPct < 50
              ? `Significant low-signal noise in your comment section. Consider deploying contextual prompt chips to redirect engagement toward depth. Your community wants to connect — they just need guidance.`
              : `Mixed signal quality detected. Use the contextual prompt chips from high-grade comments as pinned responses to shape community norms upward.`
            }
          </p>
        </div>
      </div>
    </div>
  )
}
