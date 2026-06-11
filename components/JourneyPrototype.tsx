/* eslint-disable @next/next/no-img-element */
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
  country_code: string;
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
  text?: string;
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

function seededRandom(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

export default function JourneyPrototype() {
  const articleList = articles as Article[];

  const [progress, setProgress] = useState(0);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const progressRef = useRef(0);
  const travelTweenRef = useRef<gsap.core.Tween | null>(null);
  const photoRefs = useRef<(HTMLImageElement | null)[]>([]);
  const viewerPhotoRef = useRef<HTMLImageElement | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<{
    src: string;
    index: number;
    from: DOMRect;
  } | null>(null);


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
  const [activePhotos, setActivePhotos] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/article-photos?articleId=${activeArticle.id}`)
      .then((res) => res.json())
      .then((photos: string[]) => {
        setActivePhotos(photos);
      });
  }, [activeArticle.id]);

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


  useEffect(() => {
    const fullText = activeArticle.text ?? "Texte de l’article à ajouter ici...";
    const animatedLength = 1000;

    let index = 0;
    let timeoutId: number | undefined;

    const writeNext = () => {
      index += 10;

      if (index >= Math.min(animatedLength, fullText.length)) {
        setDisplayedText(fullText);
        return;
      }

      setDisplayedText(fullText.slice(0, index));
      timeoutId = window.setTimeout(writeNext, 18);
    };

    timeoutId = window.setTimeout(() => {
      setDisplayedText("");
      writeNext();
    }, 0);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeArticle.id, activeArticle.text]);

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
    setSelectedPhoto(null);

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

  const PHOTO_AREA_TOP = 5;
  const PHOTO_AREA_HEIGHT = 70;
  const PHOTOS_PER_ROW = 2;

  return (
    <main className="journey">
      <section className="mapSection" id="journey">
        <div className="mapSticky">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mapSvg">
            <defs>
              <clipPath id="mapClip">
                <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="32" />
              </clipPath>
            </defs>

            <rect
              width={WIDTH}
              height={HEIGHT}
              rx="32"
              className="mapBackground"
            />

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
  
          <div className="photoOverlay" key={activeArticle.id}>
            {activePhotos.map((src, index) => {
              const column = index % PHOTOS_PER_ROW;
              const row = Math.floor(index / PHOTOS_PER_ROW);
              const rowCount = Math.ceil(activePhotos.length / PHOTOS_PER_ROW);
              const seed = activeArticle.id * 10000 + index * 997;
              const baseRight = column === 0 ? -8 : 10;
              const rowStep = rowCount <= 1 ? 0 : PHOTO_AREA_HEIGHT / (rowCount - 1);
              const baseTop = rowCount <= 1 ? PHOTO_AREA_TOP + PHOTO_AREA_HEIGHT / 2 : PHOTO_AREA_TOP + row * rowStep;
              const rotation = -18 + seededRandom(seed + 1) * 36;
              const right = baseRight + (-2 + seededRandom(seed + 2) * 4);
              const top = baseTop + (-3 + seededRandom(seed + 3) * 6);

              return (
                <button
                  className="tapedPhotoButton"
                  key={`${activeArticle.id}-${src}`}
                  style={{
                    right: `${right}%`,
                    top: `${top}%`,
                    "--photo-rotation": `${rotation}deg`,
                     "--photo-delay": `${index * 0.5}s`,
                  } as React.CSSProperties}
                  onClick={() => {
                    const rect = photoRefs.current[index]?.getBoundingClientRect();
                    if (!rect) return;

                    setSelectedPhoto({
                      src,
                      index,
                      from: rect,
                    });
                  }}
                >
                  <img
                    ref={(el) => {
                      photoRefs.current[index] = el;
                    }}
                    src={src}
                    alt=""
                    className="tapedPhoto"
                  />
                </button>
              );
            })}
          </div>

          {selectedPhoto && (
            <div
              className="photoViewer"
              onClick={() => {
                const img = viewerPhotoRef.current;

                if (!img) {
                  setSelectedPhoto(null);
                  return;
                }

                gsap.to(img, {
                  opacity: 0,
                  scale: 0.96,
                  duration: 0.25,
                  ease: "power2.out",
                  onComplete: () => setSelectedPhoto(null),
                });
              }}
            >
              <img
                ref={(el) => {
                  viewerPhotoRef.current = el;

                  if (!el || !selectedPhoto) return;

                  const targetWidth = Math.min(window.innerWidth * 0.72, 760);
                  const targetHeight = Math.min(window.innerHeight * 0.72, 560);

                  gsap.set(el, {
                    position: "fixed",
                    left: selectedPhoto.from.left,
                    top: selectedPhoto.from.top,
                    width: selectedPhoto.from.width,
                    height: selectedPhoto.from.height,
                    x: 0,
                    y: 0,
                    opacity: 1,
                  });

                  gsap.to(el, {
                    left: "50%",
                    top: "50%",
                    xPercent: -50,
                    yPercent: -50,
                    width: targetWidth,
                    height: targetHeight,
                    rotation: 0,
                    duration: 0.65,
                    ease: "power3.inOut",
                  });
                }}
                src={selectedPhoto.src}
                alt=""
                className="viewerPhoto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

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

          <div className="articleStoryTape">
            <div className="articleStoryText">
              <p>
                {displayedText}
                <span className="writingCursor">|</span>
              </p>
            </div>
          </div>
          
          <div className="hud">
            <div className="hudSmall">Jour {Math.round(day)}</div>
            <div className="hudBig">
              {Math.round(km).toLocaleString("fr-CH")} km
            </div>
            <div className="hudPlace">
              {displayedStop.city}, {displayedStop.country_code}
            </div>
            <div className="hudPlace">
              
            </div>
          </div>

          <div className="mapNavigation">
            <button onClick={() => goToArticle(currentArticleIndex - 1)}>
              ← précédent
            </button>
            <span>✦</span>
            <button onClick={() => goToArticle(currentArticleIndex + 1)}>
              suivant →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}