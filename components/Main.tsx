"use client";

import stops from "@/data/stops.json";
import articles from "@/data/articles.json";

import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

import VideoOverlay from "@/components/VideoOverlay";
import ArticleStory from "@/components/ArticleStory";
import ChapterRibbon from "@/components/ChapterRibbon";
import HudCard from "@/components/HudCard";
import JourneyMap from "@/components/JourneyMap";
import MapNavigation from "@/components/MapNavigation";
import PhotoOverlay from "@/components/PhotoOverlay";

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
  const [isLoopingSegment, setIsLoopingSegment] = useState(false);
  const [isMapOnly, setIsMapOnly] = useState(true);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [hoveredArticleIndex, setHoveredArticleIndex] = useState<number | null>(null);
  const [hoveredStopId, setHoveredStopId] = useState<number | null>(null);
 


  const [view, setView] = useState<MapView>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const hasPlayedIntroRef = useRef(false);
  const progressRef = useRef(0);
  const travelTweenRef = useRef<gsap.core.Animation | null>(null);

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

  const activePhotos = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      return `/articles-webp/${activeArticle.id}/${index + 1}.webp`;
    });
  }, [activeArticle.id]);

  function getProgressForStopId(stopId: number) {
    const point = points.find((p) => p.id === stopId) ?? points[0];
    return point.pathDistance / points[points.length - 1].pathDistance;
  }

  const activeSegmentStartProgress = getProgressForStopId(activeArticle.startStopId);

  const visibleProgress =
    isLoopingSegment && !isMapOnly ? activeSegmentStartProgress : progress;

  const visibleCurrent = interpolateByPathDistance(points, visibleProgress);

  const visiblePoints = [
    ...points.slice(0, visibleCurrent.activeIndex + 1),
    {
      ...visibleCurrent.point,
      x: visibleCurrent.x,
      y: visibleCurrent.y,
    },
  ];

  const visiblePath = visiblePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const activeSegmentPoints = points.filter(
    (p) =>
      p.id >= activeArticle.startStopId &&
      p.id <= activeArticle.endStopId
  );

  const activeSegmentPath = activeSegmentPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const activeStop = points[current.activeIndex];
  const nextStop = points[Math.min(current.activeIndex + 1, points.length - 1)];

  const segmentDistance = nextStop.pathDistance - activeStop.pathDistance;
  const targetDistance = progress * points[points.length - 1].pathDistance;

  const localProgress =
    segmentDistance === 0 ? 0 : (targetDistance - activeStop.pathDistance) / segmentDistance;

  const selectedStop =
    points.find((p) => p.id === hoveredStopId) ??
    points.find((p) => p.id === selectedStopId) ??
    current.point;

  const km =
    selectedStop.km_total +
    (nextStop.km_total - selectedStop.km_total) * localProgress;

  const day =
    selectedStop.day_number +
    (nextStop.day_number - selectedStop.day_number) * localProgress;

  const segmentView = getSegmentTransform(
    points,
    activeArticle.startStopId,
    activeArticle.endStopId
  );

  useEffect(() => {
    if (isMapOnly) return;

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
  }, [segmentView.x, segmentView.y, segmentView.zoom, isMapOnly]);

  const mapTransform = `translate(${view.x}, ${view.y}) scale(${view.zoom})`;

  function goToArticle(index: number) {
    const clamped = Math.max(0, Math.min(index, articleList.length - 1));
    const targetArticle = articleList[clamped];
    const targetProgress = getProgressForStopId(targetArticle.endStopId);

    setCurrentArticleIndex(clamped);
    setIsLoopingSegment(false);

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

        const animatedCurrent = interpolateByPathDistance(points, animated.value);
        setSelectedStopId(animatedCurrent.point.id);
      },
      onComplete: () => {
        setProgress(targetProgress);
        setSelectedStopId(targetArticle.endStopId);
        setIsLoopingSegment(true);
      },
    });
  }

  function playFullMap() {
    travelTweenRef.current?.kill();

    const startView = getSegmentTransform(
      points,
      articleList[0].startStopId,
      articleList[0].endStopId
    );

    const fullView = getSegmentTransform(
      points,
      articleList[0].startStopId,
      articleList[articleList.length - 1].endStopId
    );

    setIsMapOnly(true);
    setIsLoopingSegment(false);
    setSelectedStopId(null);
    setHoveredStopId(null);
    setProgress(0);

    viewRef.current = startView;
    setView(startView);

    const animated = {
      progress: 0,
      x: startView.x,
      y: startView.y,
      zoom: startView.zoom,
    };

    const tl = gsap.timeline({
      onComplete: () => {
        setProgress(1);
      },
  });

  // 1. Zoom out
  tl.to(animated, {
    x: fullView.x,
    y: fullView.y,
    zoom: fullView.zoom,
    duration: 1,
    ease: "power2.inOut",
    onUpdate: () => {
      viewRef.current = {
        x: animated.x,
        y: animated.y,
        zoom: animated.zoom,
      };

      setView({
        x: animated.x,
        y: animated.y,
        zoom: animated.zoom,
      });
    },
  });

  // 2. Déplacement du vélo
  tl.to(animated, {
    progress: 1,
    duration: 2,
    ease: "none",
    onUpdate: () => {
      setProgress(animated.progress);
    },
  });

  travelTweenRef.current = tl;
}

  useEffect(() => {
    if (!isMapOnly || hasPlayedIntroRef.current) return;

    hasPlayedIntroRef.current = true;
    playFullMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapOnly]);

  function toggleMapMode() {
    if (isMapOnly) {
      travelTweenRef.current?.kill();

      progressRef.current = 0;
      setProgress(0);
      setCurrentArticleIndex(0);
      setIsMapOnly(false);

      goToArticle(0);
      return;
    }

    playFullMap();
  }

  return (
    <main className="journey">
      
      <section className="mapSection" id="journey">

        <div className="mapSticky">
        
          <JourneyMap
            mapTransform={mapTransform}
            visiblePath={visiblePath}
            activeSegmentPath={activeSegmentPath}
            points={points}
            current={current}
            segmentView={segmentView}
            isLoopingSegment={isLoopingSegment}
            selectedStopId={selectedStopId}
            onSelectStop={setSelectedStopId}
            onHoverStop={setHoveredStopId}
            isMapOnly={isMapOnly}
          />

          <PhotoOverlay
            activeArticle={activeArticle}
            activePhotos={activePhotos}
            isMapOnly={isMapOnly}
          />

          <ChapterRibbon
            articleList={articleList}
            currentArticleIndex={currentArticleIndex}
            hoveredArticleIndex={hoveredArticleIndex}
            onSelectArticle={goToArticle}
            onHoverArticle={setHoveredArticleIndex}
            isMapOnly={isMapOnly}
          />

          <VideoOverlay 
            isMapOnly={isMapOnly}
          />

          <ArticleStory 
            activeArticle={activeArticle}
            isMapOnly={isMapOnly}
          />

          <HudCard 
            day={day}
            km={km} 
            displayedStop={selectedStop} 
            isMapOnly={isMapOnly} 
          />

          <MapNavigation
              onPrevious={() => goToArticle(currentArticleIndex - 1)}
              onNext={() => goToArticle(currentArticleIndex + 1)}
              onToggle={toggleMapMode}
              isMapOnly={isMapOnly}
          />
        </div>
      </section>
    </main>
  );
}