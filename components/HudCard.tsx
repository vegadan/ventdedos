import type { PointWithDistance } from "@/types/journey";

type HudCardProps = {
  day: number;
  km: number;
  displayedStop: PointWithDistance;
};

export default function HudCard({ day, km, displayedStop }: HudCardProps) {
  return (
    <div className="hud">
      <div className="hudSmall">Jour {Math.round(day)}</div>

      <div className="hudBig">{Math.round(km).toLocaleString("fr-CH")} km</div>

      <div className="hudPlace">
        {displayedStop.city}, {displayedStop.country_code}
      </div>

      <div className="hudPlace" />
    </div>
  );
}