export type BottleRect = { x: number; y: number; width: number };
export type PourGeometry = {
  source: BottleRect;
  destination: BottleRect;
  direction: 1 | -1;
  travelX: number;
  travelY: number;
};

export const POUR_MS = 1550;

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
};

export function createPourGeometry(source: BottleRect, destination: BottleRect): PourGeometry {
  const direction = destination.x + destination.width / 2 >= source.x + source.width / 2 ? 1 : -1;
  return {
    source,
    destination,
    direction,
    travelX: destination.x + destination.width / 2 - source.x - source.width / 2 - direction * source.width * .22,
    travelY: destination.y - source.y - source.width * .72,
  };
}

export function pourPose(t: number, g: PourGeometry) {
  const travel = t < .25 ? smooth(t / .25) : t < .86 ? 1 : 1 - smooth((t - .86) / .14);
  const tilt = t < .25 ? 0 : t < .37 ? smooth((t - .25) / .12) :
    t < .76 ? 1 : t < .86 ? 1 - smooth((t - .76) / .10) : 0;
  return { x: g.travelX * travel, y: g.travelY * travel, rotation: g.direction * 63 * tilt };
}

export function pouredUnits(t: number, count: number) {
  return Math.min(count, Math.max(0, Math.floor(clamp((t - .39) / .35) * count + 0.00001)));
}

export function pourStream(t: number) {
  return smooth((t - .32) / .08) * (1 - smooth((t - .75) / .08));
}
