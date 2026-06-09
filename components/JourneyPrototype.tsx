"use client";

import stops from "@/data/stops.json";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin
);

type Stop = {
  id: number;
  city: string;
  country_name: string;
  lat: number | string;
  lng: number | string;
  km_total: number;
  day_number: number;
};

const WIDTH = 1200;
const HEIGHT = 800;
const PADDING = 70;

function projectPoints(stops: Stop[]) {
  const points = stops.map((s) => ({
    ...s,
    latNum: Number(s.lat),
    lngNum: Number(s.lng),
  }));

  const minLat = Math.min(...points.map((p) => p.latNum));
  const maxLat = Math.max(...points.map((p) => p.latNum));
  const minLng = Math.min(...points.map((p) => p.lngNum));
  const maxLng = Math.max(...points.map((p) => p.lngNum));

  return points.map((p) => {
    const x =
      PADDING +
      ((p.lngNum - minLng) / (maxLng - minLng)) * (WIDTH - PADDING * 2);

    const y =
      PADDING +
      ((maxLat - p.latNum) / (maxLat - minLat)) * (HEIGHT - PADDING * 2);

    return {
      ...p,
      x,
      y,
    };
  });
}

function addPathDistance(points: ReturnType<typeof projectPoints>) {
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

function interpolateByPathDistance(
  points: ReturnType<typeof addPathDistance>,
  progress: number
) {
  const totalDistance = points[points.length - 1].pathDistance;
  const targetDistance = progress * totalDistance;

  const index = points.findIndex(
    (p) => p.pathDistance >= targetDistance
  );

  if (index <= 0) {
    return {
      point: points[0],
      activeIndex: 0,
      x: points[0].x,
      y: points[0].y,
    };
  }

  const a = points[index - 1];
  const b = points[index];

  const segmentDistance = b.pathDistance - a.pathDistance;

  const t =
    segmentDistance === 0
      ? 0
      : (targetDistance - a.pathDistance) / segmentDistance;

  return {
    point: a,
    activeIndex: index - 1,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export default function JourneyPrototype() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTweenRef = useRef<gsap.core.Tween | null>(null);

  const points = useMemo(
    () => addPathDistance(projectPoints(stops as Stop[])),
    []
  );

  const current = interpolateByPathDistance(points, progress);

  const visiblePoints = [
    ...points.slice(0, current.activeIndex + 1),
    {
      ...current.point,
      x: current.x,
      y: current.y,
    },
  ];

  const visiblePath = visiblePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const activeStop = points[current.activeIndex];
  const nextStop = points[Math.min(current.activeIndex + 1, points.length - 1)];

  const segmentKm = nextStop.km_total - activeStop.km_total;
  const targetKm = progress * points[points.length - 1].km_total;

  const localProgress = segmentKm === 0 ? 0 : (targetKm - activeStop.km_total) / segmentKm;

  
  const km =
    activeStop.km_total +
    (nextStop.km_total - activeStop.km_total) * localProgress;

  const day =
    activeStop.day_number +
    (nextStop.day_number - activeStop.day_number) * localProgress;

  const displayedStop = current.point;

  const zoom = 2.2;

  const viewX = WIDTH / 2 - current.x * zoom;
  const viewY = HEIGHT / 2 - current.y * zoom;

  const mapTransform = `translate(${viewX}, ${viewY}) scale(${zoom})`;

  useEffect(() => {
	  if (!containerRef.current) return;

	  const trigger = ScrollTrigger.create({
		trigger: containerRef.current,
		start: "top top",
		end: "bottom bottom",
		scrub: 1,

		onUpdate: (self) => {
		  const raw = self.progress;
    
      const start_hold = 0.02;
      const end_hold = 0.02;

		  const adjusted = Math.max(
			0,
			Math.min(1, (raw - start_hold) / (1 - start_hold - end_hold ))
		  );

		  setProgress(adjusted);
		},
	  });

	  return () => trigger.kill();
	}, []);

  function togglePlay() {
    if (isPlaying) {
      playTweenRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    playTweenRef.current = gsap.to(window, {
      duration: 90,
      scrollTo: {
        y: document.body.scrollHeight,
        autoKill: false,
      },
      ease: "none",
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    setIsPlaying(true);
  }

  return (
    <>
    <button
      className="playButton"
      onClick={togglePlay}
    >
      {isPlaying ? "⏸ Pause" : "▶ Play"}
    </button>

    <main ref={containerRef} className="journey">	

      <section className="intro">
        <h1>Vent de dos</h1>
        <p>Un voyage à vélo au fil du scroll.</p>
      </section>

      <section className="mapSection" id="journey">
        <div className="mapSticky">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mapSvg">
            <rect width={WIDTH} height={HEIGHT} rx="32" className="mapBackground" />

            <g transform={mapTransform}>
              <path d={visiblePath} className="routeActive" />

              {points.slice(0, current.activeIndex + 1).map((p) => (
                <circle key={p.id} cx={p.x} cy={p.y} r="3" className="stopDot" />
              ))}

              <g transform={`translate(${current.x}, ${current.y})`}>
                <circle r="10" className="bikeBubble" />
                <text textAnchor="middle" dominantBaseline="middle" fontSize="13">
                  🚴
                </text>
              </g>
            </g>
          </svg>

          <div className="hud">
            <div className="hudSmall">Jour {Math.round(day)}</div>
            <div className="hudBig">{Math.round(km).toLocaleString("fr-CH")} km</div>
            <div className="hudPlace">
              {displayedStop.city}, {displayedStop.country_name}
            </div>
          </div>
        </div>
      </section>

      <section className="outro">
        <h2>Fin du prototype</h2>
        <p>Si cette sensation fonctionne, on passe à la vraie carte illustrée.</p>
      </section>
    </main>
	</>
  );
}