export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
