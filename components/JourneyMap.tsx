import type { MapView, PointWithDistance } from "@/types/journey";
import { HEIGHT, WIDTH } from "@/lib/journeyGeometry";

type JourneyMapProps = {
  mapTransform: string;
  visiblePath: string;
  activeSegmentPath: string;
  points: PointWithDistance[];
  current: {
    activeIndex: number;
    x: number;
    y: number;
  };
  segmentView: MapView;
  isLoopingSegment: boolean;
  selectedStopId: number | null;
  onSelectStop: (stopId: number) => void;
  onHoverStop: (stopId: number | null) => void;
  isMapOnly: boolean;
};

export default function JourneyMap({
  mapTransform,
  visiblePath,
  activeSegmentPath,
  points,
  current,
  segmentView,
  isLoopingSegment,
  selectedStopId,
  onSelectStop,
  onHoverStop,
  isMapOnly,
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

          {!isMapOnly && isLoopingSegment && activeSegmentPath && (
            <path d={activeSegmentPath} className="routeLoopSegment" />
          )}

          {!isMapOnly && (
            <>
              {points.slice(0, current.activeIndex + 1).map((p) => (
                <g
                  key={p.id}
                  className="stopPoint"
                  onClick={() => onSelectStop(p.id)}
                  onMouseEnter={() => onHoverStop(p.id)}
                  onMouseLeave={() => onHoverStop(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={5 / segmentView.zoom}
                    className="stopDot"
                  />

                  {isLoopingSegment && selectedStopId === p.id && (
                    <g
                      transform={`translate(${p.x}, ${p.y})`}
                      className="selectedStopBike"
                    >
                      <circle r={20 / segmentView.zoom} className="bikeBubble" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={20 / segmentView.zoom}
                      >
                        🚴
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </>
          )}

          {!isLoopingSegment && (
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
          )}
        </g>
      </g>
    </svg>
  );
}