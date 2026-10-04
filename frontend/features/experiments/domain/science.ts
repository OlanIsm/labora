export function ohmsLaw(voltage: number, resistance: number) {
  return resistance > 0 ? voltage / resistance : 0;
}
export function pendulumPeriod(length: number) {
  return 2 * Math.PI * Math.sqrt(length / 9.81);
}
export function projectileRange(speed: number, angle: number) {
  return (speed * speed * Math.sin((2 * angle * Math.PI) / 180)) / 9.81;
}
export function classifyPH(ph: number) {
  return ph < 7 ? "Acidic" : ph > 7 ? "Basic" : "Neutral";
}
export function dilution(
  concentration: number,
  initialVolume: number,
  finalVolume: number,
) {
  return finalVolume > 0 ? (concentration * initialVolume) / finalVolume : 0;
}
