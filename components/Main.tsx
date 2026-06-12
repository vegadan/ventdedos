"use client";

import stops from "@/data/stops.json";
import articles from "@/data/articles.json";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

import ArticleStory from "@/components/ArticleStory";
import ChapterRibbon from "@/components/ChapterRibbon";
import HudCard from "@/components/HudCard";
import JourneyMap from "@/components/JourneyMap";
import MapNavigation from "@/components/MapNavigation";
import PhotoOverlay from "@/components/PhotoOverlay";
import GuestStoryNote from "@/components/GuestStoryNote";

import {
  addPathDistance,
  getSegmentTransform,
  interpolateByPathDistance,
  projectPoints,
} from "@/lib/journeyGeometry";

import type { Article, MapView, Stop } from "@/types/journey";

gsap.registerPlugin();

export default function Main() {
  const articleList = articles as Article[];

  const [progress, setProgress] = useState(0);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [hoveredArticleIndex, setHoveredArticleIndex] = useState<number | null>(null);
  const [activePhotos, setActivePhotos] = useState<string[]>([]);
  const [view, setView] = useState<MapView>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const progressRef = useRef(0);
  const travelTweenRef = useRef<gsap.core.Tween | null>(null);

  const viewRef = useRef<MapView>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const points = useMemo(
    () => addPathDistance(projectPoints(stops as Stop[])),
    []
  );

  const current = interpolateByPathDistance(points, progress);
  const activeArticle = articleList[currentArticleIndex];

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

  const segmentDistance = nextStop.pathDistance - activeStop.pathDistance;
  const targetDistance = progress * points[points.length - 1].pathDistance;

  const localProgress =
    segmentDistance === 0 ? 0 : (targetDistance - activeStop.pathDistance) / segmentDistance;
  
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
          <JourneyMap
            mapTransform={mapTransform}
            visiblePath={visiblePath}
            points={points}
            current={current}
            segmentView={segmentView}
          />

          <PhotoOverlay
            activeArticle={activeArticle}
            activePhotos={activePhotos}
          />

          <ChapterRibbon
            articleList={articleList}
            currentArticleIndex={currentArticleIndex}
            hoveredArticleIndex={hoveredArticleIndex}
            onSelectArticle={goToArticle}
            onHoverArticle={setHoveredArticleIndex}
          />

          <div className="articleArea">
            <ArticleStory activeArticle={activeArticle} />

            {activeArticle.guestStory && (
              <GuestStoryNote
                key={activeArticle.id}
                story={activeArticle.guestStory}
              />
            )}
          </div>

          <HudCard day={day} km={km} displayedStop={displayedStop} />

          <MapNavigation
            onPrevious={() => goToArticle(currentArticleIndex - 1)}
            onNext={() => goToArticle(currentArticleIndex + 1)}
          />
        </div>
      </section>
    </main>
  );
}