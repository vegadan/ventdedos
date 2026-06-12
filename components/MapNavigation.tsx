type MapNavigationProps = {
  onPrevious: () => void;
  onNext: () => void;
  onToggle: () => void;
  isMapOnly: boolean;
  isMapIntroDone: boolean;
};

export default function MapNavigation({
  onPrevious,
  onNext,
  onToggle,
  isMapOnly,
  isMapIntroDone
}: MapNavigationProps) {
  return (
    <>
      {!isMapOnly && (
        <>
          <div className="mapNavigation">
            <button className="navButton" onClick={onPrevious}>Précédent</button>

            <button
              type="button"
              className="mapOverviewButton"
              onClick={onToggle}
              aria-label="Voir la carte complète"
              title="Voir la carte complète"
            >
              <svg viewBox="0 0 24 24" className="mapOverviewIcon" aria-hidden="true">
                <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
                <path d="M9 3v15" />
                <path d="M15 6v15" />
              </svg>
            </button>

            <button className="navButton" onClick={onNext}>Suivant</button>
          </div>
        </>
      )}

      {isMapOnly && (
        <div
          className={`mapNavigation mapNavigationIntro ${
            isMapIntroDone ? "mapNavigationVisible" : ""
          }`}
        >
          <button className="navButton" onClick={onToggle}>
            Monter en selle
          </button>
        </div>
      )}
    </>
  );
}