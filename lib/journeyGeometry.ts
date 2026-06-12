import { geoMercator } from "d3-geo";
import type { PointWithDistance, ProjectedStop, Stop } from "@/types/journey";

export const WIDTH = 1200;
export const HEIGHT = 800;

export function projectPoints(stops: Stop[]): ProjectedStop[] {
  const points = stops.map((s) => ({
    ...s,
    latNum: Number(s.lat),
    lngNum: Number(s.lng),
  }));

  const projection = geoMercator()
    .center([10, 49])
    .scale(520)
    .translate([WIDTH / 2, HEIGHT / 2]);

  return points.map((p) => {
    const projected = projection([p.lngNum, p.latNum]);

    return {
      ...p,
      x: projected?.[0] ?? 0,
      y: projected?.[1] ?? 0,
    };
  });
}

export function addPathDistance(points: ProjectedStop[]): PointWithDistance[] {
  let distance = 0;

  return points.map((p, index) => {
    if (index > 0) {
      const prev = points[index - 1];
      distance += Math.hypot(p.x - prev.x, p.y - prev.y);
    }

    return {
      ...p,
      pathDistance: distance,
    };
  });
}

export function interpolateByPathDistance(
  points: PointWithDistance[],
  progress: number
) {
  const totalDistance = points[points.length - 1].pathDistance;
  const safeProgress = Math.max(0, Math.min(1, progress));
  const targetDistance = safeProgress * totalDistance;
  const epsilon = totalDistance * 0.000001;

  const index = points.findIndex((p) => p.pathDistance >= targetDistance);

  if (index <= 0) {
    return { point: points[0], activeIndex: 0, x: points[0].x, y: points[0].y };
  }

  const a = points[index - 1];
  const b = points[index];

  if (Math.abs(targetDistance - b.pathDistance) <= epsilon) {
    return { point: b, activeIndex: index, x: b.x, y: b.y };
  }

  const segmentDistance = b.pathDistance - a.pathDistance;
  const t =
    segmentDistance === 0 ? 0 : (targetDistance - a.pathDistance) / segmentDistance;

  return {
    point: a,
    activeIndex: index - 1,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export function getSegmentTransform(
  points: ProjectedStop[],
  startStopId: number,
  endStopId: number
) {
  const segmentPoints = points.filter(
    (p) => p.id >= startStopId && p.id <= endStopId
  );

  const minX = Math.min(...segmentPoints.map((p) => p.x));
  const maxX = Math.max(...segmentPoints.map((p) => p.x));
  const minY = Math.min(...segmentPoints.map((p) => p.y));
  const maxY = Math.max(...segmentPoints.map((p) => p.y));

  const padding = 60;
  const maxZoom = 12;
  const minZoom = 1.4;

  const targetWidth = WIDTH * 0.7;
  const targetHeight = HEIGHT * 0.7;

  const segmentWidth = maxX - minX;
  const segmentHeight = maxY - minY;

  const zoom = Math.min(
    maxZoom,
    Math.max(
      minZoom,
      Math.min(
        targetWidth / (segmentWidth + padding),
        targetHeight / (segmentHeight + padding)
      )
    )
  );

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    zoom,
    x: WIDTH / 2 - centerX * zoom,
    y: HEIGHT / 2 - centerY * zoom,
  };
}

export function seededRandom(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}