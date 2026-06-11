import type { MapView, PointWithDistance } from "@/types/journey";
import { HEIGHT, WIDTH } from "@/lib/journeyGeometry";

type JourneyMapProps = {
  mapTransform: string;
  visiblePath: string;
  points: PointWithDistance[];
  current: {
    activeIndex: number;
    x: number;
    y: number;
  };
  segmentView: MapView;
};

export default function JourneyMap({
  mapTransform,
  visiblePath,
  points,
  current,
  segmentView,
}: JourneyMapProps) {
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mapSvg">
      <defs>
        <clipPath id="mapClip">
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="32" />
        </clipPath>
      </defs>

      <rect width={WIDTH} height={HEIGHT} rx="32" className="mapBackground" />

      <g clipPath="url(#mapClip)">
        <g transform={mapTransform}>
          <image
            href="/maps/europe-simplified.svg"
            x="0"
            y="0"
            width={WIDTH}
            height={HEIGHT}
            className="baseMapImage"
          />

          <path d={visiblePath} className="routeActive" />

          {points.slice(0, current.activeIndex + 1).map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={3 / segmentView.zoom}
              className="stopDot"
            />
          ))}

          <g transform={`translate(${current.x}, ${current.y})`}>
            <circle r={20 / segmentView.zoom} className="bikeBubble" />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={20 / segmentView.zoom}
            >
              🚴
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}