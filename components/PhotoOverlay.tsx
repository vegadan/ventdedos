/* eslint-disable @next/next/no-img-element */
import gsap from "gsap";
import { useRef, useState } from "react";
import { seededRandom } from "@/lib/journeyGeometry";
import type { Article } from "@/types/journey";

type PhotoOverlayProps = {
  activeArticle: Article;
  activePhotos: string[];
  isMapOnly: boolean;
};

export default function PhotoOverlay({
  activeArticle,
  activePhotos,
  isMapOnly
}: PhotoOverlayProps) {
  const photoRefs = useRef<(HTMLImageElement | null)[]>([]);
  const viewerPhotoRef = useRef<HTMLImageElement | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<{
    src: string;
    index: number;
    from: DOMRect;
  } | null>(null);

  if (isMapOnly) return null;
  
  const PHOTO_AREA_TOP = 5;
  const PHOTO_AREA_HEIGHT = 70;
  const PHOTOS_PER_ROW = 2;

  return (
    <>
      <div className="photoOverlay" key={activeArticle.id}>
        {activePhotos.map((src, index) => {
          const column = index % PHOTOS_PER_ROW;
          const row = Math.floor(index / PHOTOS_PER_ROW);
          const rowCount = Math.ceil(activePhotos.length / PHOTOS_PER_ROW);
          const seed = activeArticle.id * 10000 + index * 997;

          const baseRight = column === 0 ? -8 : 10;
          const rowStep =
            rowCount <= 1 ? 0 : PHOTO_AREA_HEIGHT / (rowCount - 1);

          const baseTop =
            rowCount <= 1
              ? PHOTO_AREA_TOP + PHOTO_AREA_HEIGHT / 2
              : PHOTO_AREA_TOP + row * rowStep;

          const rotation = -18 + seededRandom(seed + 1) * 36;
          const right = baseRight + (-2 + seededRandom(seed + 2) * 4);
          const top = baseTop + (-3 + seededRandom(seed + 3) * 6);

          return (
            <button
              className="tapedPhotoButton"
              key={`${activeArticle.id}-${src}`}
              style={
                {
                  right: `${right}%`,
                  top: `${top}%`,
                  "--photo-rotation": `${rotation}deg`,
                  "--photo-delay": `${index * 0.5}s`,
                } as React.CSSProperties
              }
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
    </>
  );
}