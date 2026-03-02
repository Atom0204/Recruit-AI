export const clampScore = (value: number, min = 0, max = 100): number => {
  return Math.min(max, Math.max(min, value));
};

export const normalizeWeights = (weights: number[]): number[] => {
  const total = weights.reduce((sum, current) => sum + current, 0);
  if (total <= 0) {
    return weights.map(() => 0);
  }
  return weights.map((weight) => Number((weight / total).toFixed(4)));
};
