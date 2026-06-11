type MapNavigationProps = {
  onPrevious: () => void;
  onNext: () => void;
};

export default function MapNavigation({
  onPrevious,
  onNext,
}: MapNavigationProps) {
  return (
    <div className="mapNavigation">
      <button onClick={onPrevious}>← précédent</button>
      <span>✦</span>
      <button onClick={onNext}>suivant →</button>
    </div>
  );
}