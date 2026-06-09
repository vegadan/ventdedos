"use client";

import stops from "@/data/stops.json";
import articles from "@/data/articles.json";
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

type Article = {
  id: number;
  title: string;
  startStopId: number;
  endStopId: number;
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

function getActiveArticle(stopId: number): Article {
  return (
    (articles as Article[]).find(
      (article) =>
        stopId >= article.startStopId && stopId <= article.endStopId
    ) ?? (articles as Article[])[0]
  );
}

function getSegmentTransform(
  points: ReturnType<typeof projectPoints>,
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

  const padding = 30;
  
  const maxZoom = 12;
  const minZoom = 1.4;

  const targetWidth = WIDTH * 0.9;
  const targetHeight = HEIGHT * 0.9;

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

  const activeArticle = getActiveArticle(current.point.id);

  const segmentView = getSegmentTransform(
    points,
    activeArticle.startStopId,
    activeArticle.endStopId
  );

  const mapTransform = `translate(${segmentView.x}, ${segmentView.y}) scale(${segmentView.zoom})`;

  useEffect(() => {
	  if (!containerRef.current) return;

	  const trigger = ScrollTrigger.create({
		trigger: "#journey",
		start: "top top",
		end: "bottom bottom",
		scrub: 1,

		onUpdate: (self) => {
        const START_HOLD_VH = 1.0;
        const END_HOLD_VH = 1.0;

        const totalScrollPx = self.end - self.start;
        const currentScrollPx = self.progress * totalScrollPx;

        const startHoldPx = window.innerHeight * START_HOLD_VH;
        const endHoldPx = window.innerHeight * END_HOLD_VH;

        const travelScrollPx = totalScrollPx - startHoldPx - endHoldPx;

        const adjusted = Math.max(
          0,
          Math.min(
            1,
            (currentScrollPx - startHoldPx) / travelScrollPx
          )
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
                <circle key={p.id} cx={p.x} cy={p.y} r={3 / segmentView.zoom} className="stopDot" />
              ))}

              <g transform={`translate(${current.x}, ${current.y})`}>
                <circle r={20 / segmentView.zoom} className="bikeBubble" />
                <text  textAnchor="middle" dominantBaseline="middle" fontSize={20 / segmentView.zoom}>
                  🚴
                </text>
              </g>
            </g>
          </svg>

          <div className="hud">
            <div className="hudSmall">Jour {Math.round(day)}</div>
            <div className="hudBig">{Math.round(km).toLocaleString("fr-CH")} km</div>
            <div className="hudPlace">{displayedStop.city}, {displayedStop.country_name}</div>
            <div className="hudArticle">{activeArticle.title}</div>
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