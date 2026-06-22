type ShouldAutoCommitBufferedFeaturedPageInput = {
  hasBufferedPage: boolean;
  isLoading: boolean;
  forceCommit?: boolean;
  remainingDistanceToBottom: number;
  commitDistancePx: number;
};

export function shouldAutoCommitBufferedFeaturedPage(
  input: ShouldAutoCommitBufferedFeaturedPageInput
) {
  if (!input.hasBufferedPage) {
    return false;
  }

  if (input.isLoading || input.forceCommit) {
    return true;
  }

  if (!Number.isFinite(input.remainingDistanceToBottom)) {
    return false;
  }

  return input.remainingDistanceToBottom <= input.commitDistancePx;
}
