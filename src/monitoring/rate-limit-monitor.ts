const state = { blocked: 0, allowed: 0 }

export const noteRateLimitDecision = (blocked: boolean) => {
  if (blocked) state.blocked += 1
  else state.allowed += 1
}

export const getRateLimitStats = () => ({ ...state, total: state.blocked + state.allowed })
export const clearRateLimitStats = () => { state.blocked = 0; state.allowed = 0 }
