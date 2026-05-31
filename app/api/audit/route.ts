import { NextRequest } from 'next/server'
import { scrapeContent, detectPlatform, isYouTubeVideo, isXPost } from '@/lib/apify'
import { uploadContent } from '@/lib/tigris'
import { generateVibeBlueprint } from '@/lib/nebius'
import { dbInsert, db } from '@/lib/insforge'
import { evaluateComment } from '@/lib/evaluator'
import {
  scoreToGrade,
  generateFeedback,
  computeAnalytics,
  DEMO_COMMENTS,
  type GradedComment,
} from '@/lib/grader'
import type { ContentItem, VibeBlueprint } from '@/lib/insforge'

// Evaluate a batch of raw comment strings against a blueprint, in parallel
async function gradeComments(
  comments: string[],
  blueprint: VibeBlueprint
): Promise<GradedComment[]> {
  const results = await Promise.allSettled(
    comments.map((text) => evaluateComment(text, blueprint))
  )

  return results
    .map((r, i) => {
      if (r.status === 'rejected') return null
      const ev = r.value
      const grade = scoreToGrade(ev.score)
      return {
        text: comments[i],
        grade,
        score: ev.score,
        principleScores: ev.principleScores,
        principles: ev.principles,
        globalViolations: ev.globalViolations,
        confidence: ev.confidence,
        feedback: generateFeedback(grade, ev.principles, ev.globalViolations),
      } satisfies GradedComment
    })
    .filter((c): c is GradedComment => c !== null)
}

// POST /api/audit
// Body: { url } → scrape + blueprint + grade live comments
// Body: { contentItemId } → grade demo representative comments using existing blueprint
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url, contentItemId } = body as { url?: string; contentItemId?: string }

  // ── Path A: contentItemId → demo audit with representative comments ──────
  if (contentItemId && !url) {
    try {
      const { data } = await db.database
        .from('content_items')
        .select()
        .eq('id', contentItemId)
        .limit(1)

      const items = (data ?? []) as ContentItem[]
      if (!items.length || !items[0].vibe_blueprint) {
        return Response.json({ error: 'Content item not found or blueprint missing' }, { status: 404 })
      }

      const item = items[0]
      const blueprint = item.vibe_blueprint as VibeBlueprint
      const platform = item.platform as 'youtube' | 'x'
      const demoComments = DEMO_COMMENTS[platform] ?? DEMO_COMMENTS.youtube

      const gradedComments = await gradeComments(demoComments, blueprint)
      const analytics = computeAnalytics(gradedComments)

      return Response.json({ gradedComments, analytics, source: 'demo' })
    } catch (err) {
      console.error('[audit:demo]', err)
      return Response.json({ error: 'Audit failed' }, { status: 500 })
    }
  }

  // ── Path B: url → full scrape + blueprint + grade live comments ──────────
  if (!url?.trim()) {
    return Response.json({ error: 'url or contentItemId required' }, { status: 400 })
  }

  const platform = detectPlatform(url)
  if (!platform) {
    return Response.json({ error: 'Unsupported URL. Paste a YouTube or X/Twitter link.' }, { status: 400 })
  }
  if (platform === 'youtube' && !isYouTubeVideo(url)) {
    return Response.json({
      error: 'Paste a specific YouTube video URL (youtube.com/watch?v=...), not a channel page.',
    }, { status: 400 })
  }
  if (platform === 'x' && !isXPost(url)) {
    return Response.json({
      error: 'Paste a specific X post URL (x.com/user/status/...), not a profile page.',
    }, { status: 400 })
  }

  try {
    const content = await scrapeContent(url)

    // Upload transcript to Tigris
    const tigrisKey = `transcripts/${platform}/${Date.now()}.txt`
    await uploadContent(tigrisKey, content.primaryText)

    // Generate Vibe Blueprint
    const blueprint = await generateVibeBlueprint(content.primaryText)

    // Store content item in InsForge
    const stored = await dbInsert<ContentItem>('content_items', {
      platform,
      content_url: url,
      creator_handle: content.creatorHandle,
      tigris_key: tigrisKey,
      vibe_blueprint: blueprint,
    })

    // Use real Apify comments if available, otherwise fall back to demo set
    const commentsToGrade =
      content.rawComments.length >= 3
        ? content.rawComments
        : DEMO_COMMENTS[platform]

    const gradedComments = await gradeComments(commentsToGrade, blueprint)
    const analytics = computeAnalytics(gradedComments)

    return Response.json({
      contentItemId: stored.id,
      creatorHandle: content.creatorHandle,
      title: content.title,
      platform,
      contentUrl: url,
      vibeBlueprint: blueprint,
      gradedComments,
      analytics,
      source: content.rawComments.length >= 3 ? 'live' : 'demo',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed'
    console.error('[audit:live]', err)
    return Response.json({ error: message }, { status: 500 })
  }
}
