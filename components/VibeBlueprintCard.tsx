'use client'
import type { VibeBlueprint } from '@/lib/insforge'

const PRINCIPLE_LABELS: Record<string, string> = {
  'respect-user-attention': 'Respect User Attention',
  'prioritize-long-term-wellbeing': 'Prioritize Long-Term Wellbeing',
  'protect-dignity-and-safety': 'Protect Dignity & Safety',
  'enhance-human-capabilities': 'Enhance Human Capabilities',
}

const EMOTIONAL_COLORS: Record<string, string> = {
  vulnerable: 'bg-purple-900/50 text-purple-300 border border-purple-800',
  aspirational: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  technical: 'bg-slate-800 text-slate-300 border border-slate-700',
  creative: 'bg-orange-900/50 text-orange-300 border border-orange-800',
  exploratory: 'bg-green-900/50 text-green-300 border border-green-800',
  humorous: 'bg-yellow-900/50 text-yellow-300 border border-yellow-800',
}

interface Props {
  blueprint: VibeBlueprint
  creatorHandle: string
  platform: 'youtube' | 'x'
}

export default function VibeBlueprintCard({ blueprint, creatorHandle, platform }: Props) {
  const emotionClass =
    EMOTIONAL_COLORS[blueprint.vibe_state.emotional_context] ?? 'bg-slate-100 text-slate-800'

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-violet-300 text-xs font-medium uppercase tracking-widest">
              Vibe Blueprint
            </p>
            <h2 className="text-white font-bold text-lg mt-0.5">{creatorHandle}</h2>
          </div>
          <span className="text-2xl">{platform === 'youtube' ? '▶' : '𝕏'}</span>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {/* Vibe State */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Vibe State
            </span>
            <span className="text-xs text-slate-600">
              · {PRINCIPLE_LABELS[blueprint.vibe_state.humanebench_principle]}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${emotionClass}`}>
              {blueprint.vibe_state.emotional_context}
            </span>
            <p className="text-sm text-slate-400">{blueprint.vibe_state.description}</p>
          </div>
        </div>

        {/* True Intent */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              True Intent
            </span>
            <span className="text-xs text-slate-600">
              · {PRINCIPLE_LABELS[blueprint.true_intent.humanebench_principle]}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-200 capitalize">
            {blueprint.true_intent.community_need}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{blueprint.true_intent.description}</p>
        </div>

        {/* Interaction Boundaries */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Boundaries
            </span>
            <span className="text-xs text-slate-600">
              · {PRINCIPLE_LABELS[blueprint.interaction_boundaries.humanebench_principle]}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {blueprint.interaction_boundaries.avoid.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/50 text-red-400 border border-red-900 text-xs"
              >
                ✕ {item}
              </span>
            ))}
          </div>
        </div>

        {/* Contextual Prompts */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Prompt Chips
            </span>
            <span className="text-xs text-slate-600">
              · {PRINCIPLE_LABELS[blueprint.contextual_prompts.humanebench_principle]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {blueprint.contextual_prompts.prompt_chips.map((chip) => (
              <span
                key={chip}
                className="inline-block px-3 py-1 rounded-full bg-indigo-900/50 text-indigo-300 text-xs font-medium border border-indigo-800"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
