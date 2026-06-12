import type { PointWithDistance } from "@/types/journey";

type HudCardProps = {
  day: number;
  km: number;
  displayedStop: PointWithDistance;
  isMapOnly: boolean;
};

function formatFrenchDate(date?: string) {
  if (!date) return null;

  return new Intl.DateTimeFormat("fr-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function HudCard({ day, km, displayedStop, isMapOnly }: HudCardProps)
{
  if(isMapOnly) 
  {
    return (
      <div className="hud">
        <div className="hudSmall">{Math.round(day)} jours</div>

        <div className="hudBig">
          {Math.round(km).toLocaleString("fr-CH")} km
        </div>

        <div className="hudPlace">30 pays</div>
      </div>
    );
  }
  else
  {
    const departureDate = formatFrenchDate(displayedStop.departure_date);
    
    return (
      <div className="hud">
        <div className="hudSmall">Jour {Math.round(day)} - Le {departureDate}</div>

        <div className="hudBig">
          {Math.round(km).toLocaleString("fr-CH")} km
        </div>

        <div className="hudPlace">
          {displayedStop.city}, {displayedStop.country_name}
        </div>
      </div>
    );
  }
}