"use client";

import { geoMercator } from "d3-geo";
import stops from "@/data/stops.json";
import articles from "@/data/articles.json";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

gsap.registerPlugin();

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

function projectPoints(stops: Stop[]) {
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

  const index = points.findIndex((p) => p.pathDistance >= targetDistance);

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

export default function JourneyPrototype() {
  const articleList = articles as Article[];

  const [progress, setProgress] = useState(0);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);

  const progressRef = useRef(0);
  const travelTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const [view, setView] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const viewRef = useRef({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const points = useMemo(
    () => addPathDistance(projectPoints(stops as Stop[])),
    []
  );

  const current = interpolateByPathDistance(points, progress);

  const activeArticle = articleList[currentArticleIndex];

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

  const localProgress =
    segmentKm === 0 ? 0 : (targetKm - activeStop.km_total) / segmentKm;

  const km =
    activeStop.km_total +
    (nextStop.km_total - activeStop.km_total) * localProgress;

  const day =
    activeStop.day_number +
    (nextStop.day_number - activeStop.day_number) * localProgress;

  const displayedStop = current.point;

  const segmentView = getSegmentTransform(
    points,
    activeArticle.startStopId,
    activeArticle.endStopId
  );

  useEffect(() => {
    gsap.to(viewRef.current, {
      x: segmentView.x,
      y: segmentView.y,
      zoom: segmentView.zoom,
      duration: 1.2,
      ease: "power2.inOut",
      onUpdate: () => {
        setView({
          x: viewRef.current.x,
          y: viewRef.current.y,
          zoom: viewRef.current.zoom,
        });
      },
    });
  }, [segmentView.x, segmentView.y, segmentView.zoom]);

  const mapTransform = `translate(${view.x}, ${view.y}) scale(${view.zoom})`;

  function getProgressForStopId(stopId: number) {
    const point = points.find((p) => p.id === stopId) ?? points[0];
    return point.pathDistance / points[points.length - 1].pathDistance;
  }

  function goToArticle(index: number) {
    const clamped = Math.max(0, Math.min(index, articleList.length - 1));
    const targetArticle = articleList[clamped];
    const targetProgress = getProgressForStopId(targetArticle.endStopId);

    setCurrentArticleIndex(clamped);

    travelTweenRef.current?.kill();

    const animated = {
      value: progressRef.current,
    };

    travelTweenRef.current = gsap.to(animated, {
      value: targetProgress,
      duration: 5.0,
      ease: "none",
      repeat: 0,
      onUpdate: () => {
        setProgress(animated.value);
      },
    });
  }

  return (
    <main className="journey">
      <section className="mapSection" id="journey">
        <div className="mapSticky">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mapSvg">
            <rect width={WIDTH} height={HEIGHT} rx="32" className="mapBackground" />

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
          </svg>

          <div className="chapterRibbon">
            <div className="activeChapterTitle">
              {articleList[currentArticleIndex]?.title}
            </div>

            <div className="chapterNumbers">
              {articleList.map((article, index) => (
                <button
                  key={article.id}
                  onClick={() => goToArticle(index)}
                  className={index === currentArticleIndex ? "active" : ""}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <div className="hud">
            <div className="hudSmall">Jour {Math.round(day)}</div>
            <div className="hudBig">
              {Math.round(km).toLocaleString("fr-CH")} km
            </div>
            <div className="hudPlace">
              {displayedStop.city}, {displayedStop.country_name}
            </div>
          </div>

         <div className="mapNavigation">
            <button onClick={() => goToArticle(currentArticleIndex - 1)}>← précédent</button>
            <span>✦</span>
            <button onClick={() => goToArticle(currentArticleIndex + 1)}>suivant →</button>
          </div>
        </div>
      </section>
    </main>
  );
}