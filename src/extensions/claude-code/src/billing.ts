/** Claude Code's `rate_limit_event.rate_limit_info`, as far as this provider relies on it. */
export interface RateLimitInfo {
  status?: string
  rateLimitType?: string
  resetsAt?: number
  /** A rejected plan window is being served from usage credits. */
  isUsingOverage?: boolean
  /** This request was billed to usage credits, even when no plan window is rejected. */
  overageInUse?: boolean
  overageStatus?: string
  overageDisabledReason?: string
  [key: string]: unknown
}

// Anthropic rejects or reroutes requests it classifies as third-party app usage with these messages. Every error
// below contains "billing" so Pi's retry classifier treats it as a non-retryable account error.
const usageCreditsRejection =
  /third-party apps now draw from your extra usage|out of extra usage|draws? from your usage credits/iu

/** Whether Claude Code reports the request as billed to usage credits instead of plan limits. */
export function isChargedToUsageCredits(info: RateLimitInfo | undefined): info is RateLimitInfo {
  return info?.isUsingOverage === true || info?.overageInUse === true
}

/** Claude Code reported a charge to usage credits. Nothing may retry the turn: a retry is charged again. */
export class UsageCreditsCharged extends Error {}

export function usageCreditsChargeError(info: RateLimitInfo): UsageCreditsCharged {
  const limit = `${info.status ?? "unknown"}${info.rateLimitType ? `, ${info.rateLimitType}` : ""}`

  return new UsageCreditsCharged(
    `Claude Code billing: this request was charged to Claude usage credits instead of your plan limits (rate limit status ${limit}). ` +
      "The turn stopped so further requests are not charged. To stay on plan limits only, turn off usage credits at claude.ai/settings/usage.",
  )
}

/** Rewrite an Anthropic usage-credit rejection into an actionable, non-retryable error. */
export function describeUsageCreditsRejection(message: string): string | undefined {
  if (!usageCreditsRejection.test(message)) return undefined

  return (
    "Claude Code billing: Anthropic did not accept this request on your Claude plan limits and wants to charge " +
    "it to usage credits. This happens when your plan limit is used up, or when Anthropic classifies the " +
    `request as third-party app usage. It will not be retried. Original error: ${message}`
  )
}
