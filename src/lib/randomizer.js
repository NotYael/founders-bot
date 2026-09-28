/** Fisher–Yates shuffle; returns a new array. */
export function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles people into a single circle: each person reviews the next, and the last reviews the first.
 * Everyone reviews exactly one person and is reviewed by exactly one person (never themselves).
 * Returns [{ reviewer, reviewee }, ...].
 */
export function circularPairs(people) {
  const order = shuffle(people);
  return order.map((reviewer, i) => ({ reviewer, reviewee: order[(i + 1) % order.length] }));
}
