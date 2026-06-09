"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import stops from "@/data/stops.json";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin
);

gsap.registerPlugin(ScrollTrigger);

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

function interpolate(points: ReturnType<typeof projectPoints>, progress: number) {
  const maxIndex = points.length - 1;
  const exact = progress * maxIndex;
  const index = Math.floor(exact);
  const t = exact - index;

  if (index >= maxIndex) {
    return {
      point: points[maxIndex],
      activeIndex: maxIndex,
      x: points[maxIndex].x,
      y: points[maxIndex].y,
    };
  }

  const a = points[index];
  const b = points[index + 1];

  return {
    point: a,
    activeIndex: index,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}


export default function JourneyPrototype() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const points = useMemo(() => projectPoints(stops as Stop[]), []);
  const current = interpolate(points, progress);

  const visiblePoints = points.slice(0, current.activeIndex + 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const visiblePath = visiblePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const activeStop = points[current.activeIndex];
  const nextStop = points[Math.min(current.activeIndex + 1, points.length - 1)];

  const localProgress = progress * (points.length - 1) - current.activeIndex;

  const km =
    activeStop.km_total +
    (nextStop.km_total - activeStop.km_total) * localProgress;

  const day =
    activeStop.day_number +
    (nextStop.day_number - activeStop.day_number) * localProgress;

  useEffect(() => {
	  if (!containerRef.current) return;

	  const trigger = ScrollTrigger.create({
		trigger: containerRef.current,
		start: "top top",
		end: "bottom bottom",
		scrub: 1,

		onUpdate: (self) => {
		  const raw = self.progress;

		  // 8% de marge au début
		  // 8% de marge à la fin
		  const adjusted = Math.max(
			0,
			Math.min(1, (raw - 0.08) / 0.84)
		  );

		  setProgress(adjusted);
		},
	  });

	  return () => trigger.kill();
	}, []);

return (
  <>
<button
  className="playButton"
  onClick={() => {
    gsap.to(window, {
      duration: 90,
      scrollTo: {
        y: document.body.scrollHeight,
        autoKill: true,
      },
      ease: "none",
    });
  }}
>
  ▶ Play
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

            <path d={path} className="routeGhost" />
            <path d={visiblePath} className="routeActive" />

            {points.map((p) => (
              <circle key={p.id} cx={p.x} cy={p.y} r="3" className="stopDot" />
            ))}

            <g transform={`translate(${current.x}, ${current.y})`}>
              <circle r="18" className="bikeBubble" />
              <text textAnchor="middle" dominantBaseline="middle" fontSize="22">
                🚴
              </text>
            </g>
          </svg>

          <div className="hud">
            <div className="hudSmall">Jour {Math.round(day)}</div>
            <div className="hudBig">{Math.round(km).toLocaleString("fr-CH")} km</div>
            <div className="hudPlace">
              {activeStop.city}, {activeStop.country_name}
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