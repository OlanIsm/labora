type Rectangle = { x: number; y: number; width: number; height: number };

export function findBenchSpace(
  width: number,
  height: number,
  itemWidth: number,
  itemHeight: number,
  occupied: Rectangle[],
) {
  const gap = 24,
    padding = 16;
  for (
    let y = padding;
    y + itemHeight + padding <= height;
    y += itemHeight + gap
  ) {
    for (
      let x = padding;
      x + itemWidth + padding <= width;
      x += itemWidth + gap
    ) {
      if (
        occupied.every(
          (rect) =>
            x + itemWidth + gap <= rect.x ||
            x >= rect.x + rect.width + gap ||
            y + itemHeight + gap <= rect.y ||
            y >= rect.y + rect.height + gap,
        )
      ) {
        return { x: (x / width) * 100, y: (y / height) * 100 };
      }
    }
  }
  return undefined;
}
