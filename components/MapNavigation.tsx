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
      <button className="navButton" onClick={onPrevious}>Précédent</button>
      <img className="navLogo" src="/icons/logo.png" alt="Logo Vent de Dos"/>
      <button className="navButton" onClick={onNext}>Suivant</button>
    </div>
  );
}