export function fitOnBench(
  x: number,
  y: number,
  width: number,
  height: number,
  itemWidth: number,
  itemHeight: number,
) {
  const limitX = width > 0 ? Math.max(0, 100 - (itemWidth / width) * 100) : 0;
  const limitY =
    height > 0 ? Math.max(0, 100 - (itemHeight / height) * 100) : 0;
  return {
    x: Number.isFinite(x) ? Math.max(0, Math.min(limitX, x)) : 0,
    y: Number.isFinite(y) ? Math.max(0, Math.min(limitY, y)) : 0,
  };
}
