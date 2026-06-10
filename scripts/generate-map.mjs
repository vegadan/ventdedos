import fs from "fs";
import { feature } from "topojson-client";
import countries from "world-atlas/countries-50m.json" with { type: "json" };
import { geoMercator, geoPath } from "d3-geo";

const WIDTH = 1200;
const HEIGHT = 800;

const projection = geoMercator()
  .center([10, 49])
  .scale(520)
  .translate([WIDTH / 2, HEIGHT / 2]);

function project(lng, lat) {
  return projection([lng, lat]);
}

function polygonToPath(coords) {
  return coords
    .map((ring) =>
      ring
        .map(([lng, lat], index) => {
          const clampedLat = Math.min(lat, 71);
          const [x, y] = project(lng, clampedLat);
          return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ") + " Z"
    )
    .join(" ");
}

const land = feature(countries, countries.objects.countries);

const path = geoPath(projection);

const paths = land.features
  .map((country) => {
    const d = path(country);
    return d ? `<path d="${d}" />` : "";
  })
  .join("\n");

const labels = [
  { name: "FRANCE", x: 2.2, y: 46.6, size: 5 },
  { name: "ESPAGNE", x: -3.7, y: 40.3, size: 5 },
  { name: "PORTUGAL", x: -8.0, y: 39.7, size: 5, rotate: -90},
  { name: "MAROC", x: -4.5, y: 34.0, size: 5 },

  { name: "ITALIE", x: 12.8, y: 42.6, size: 5},
  { name: "SUISSE", x: 8.1, y: 46.8, size: 5 },
  { name: "ALLEMAGNE", x: 10.4, y: 51.0, size: 5 },
  { name: "BELGIQUE", x: 4.5, y: 50.7, size: 3 },
  { name: "PAYS-BAS", x: 5.7, y: 52.3, size: 3 },

  { name: "DANEMARK", x: 9.25, y: 56.2, size: 3 },
  { name: "NORVÈGE", x: 10, y: 61.0, size: 5},
  { name: "SUÈDE", x: 15, y: 62.0, size: 5 },
  { name: "FINLANDE", x: 26, y: 62, size: 5 },

  { name: "POLOGNE", x: 19.0, y: 52.0, size: 5 },
  { name: "TCHÉQUIE", x: 15, y: 49.6, size: 5 },
  { name: "AUTRICHE", x: 14.6, y: 47.3, size: 5 },
  { name: "SLOVÉNIE", x: 14.6, y: 46.1, size: 3 },
  { name: "CROATIE", x: 16.5, y: 45.5, size: 3 },
  { name: "BOSNIE", x: 17.8, y: 44.0, size: 3 },
  { name: "SERBIE", x: 20.7, y: 44.0, size: 3 },
  { name: "ROUMANIE", x: 25.0, y: 45.7, size: 5 },
  { name: "BULGARIE", x: 25.3, y: 42.6, size: 5 },
  { name: "GRÈCE", x: 21.8, y: 39.7, size: 3 },
  { name: "ALBANIE", x: 20, y: 41, size: 3, rotate: -90},
  { name: "UKRAINE", x: 31.0, y: 49.0, size: 5 },
  { name: "TURQUIE", x: 30.0, y: 39.2, size: 5 },

  { name: "Océan Atlantique", x: -5.4, y: 45.0, size: 8, sea: true },
  { name: "Mer du Nord", x: 3.2, y: 56, size: 8, sea: true },
  { name: "Mer Baltique", x: 18, y: 55.5, size: 8, sea: true },
  { name: "Mer Méditerranée", x: 8.0, y: 38.0, size: 8, sea: true },
  { name: "Mer Noire", x: 31.5, y: 43.4, size: 8, sea: true },
];

const labelSvg = labels
  .map((label) => {
    const [x, y] = project(label.x, label.y);
    const transform = label.rotate
      ? `transform="rotate(${label.rotate} ${x.toFixed(2)} ${y.toFixed(2)})"`
      : "";

    return `<text
      x="${x.toFixed(2)}"
      y="${y.toFixed(2)}"
      ${transform}
      class="${label.sea ? "sea-label" : "country-label"}"
      font-size="${label.size}"
    >${label.name}</text>`;
  })
  .join("\n");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <style>
    path {
      fill: #f3efe5;
      stroke: #b9b09f;
      stroke-width: 0.35;
      vector-effect: non-scaling-stroke;
    }

    .sea-bg {
      fill: #f7eedc;
    }

    .country {
      fill: #e8dcc6;
      stroke: #b7a98f;
      stroke-width: 0.35;
      vector-effect: non-scaling-stroke;
    }

    .country-label {
      font-family: system-ui, sans-serif;
      font-weight: 600;
      fill: #7a7164;
      text-anchor: middle;
      dominant-baseline: middle;
      letter-spacing: 0.08em;
      pointer-events: none;
    }

    .sea-label {
      font-family: system-ui, sans-serif;
      font-style: italic;
      font-weight: 400;
      fill: #9aa6ad;
      text-anchor: middle;
      dominant-baseline: middle;
      pointer-events: none;
    }
  </style>

  <rect class="sea-bg" width="${WIDTH}" height="${HEIGHT}" />

  <g class="countries">
    ${paths.replaceAll("<path ", '<path class="country" ')}
  </g>

  <g class="labels">
    ${labelSvg}
  </g>
</svg>
`;

fs.mkdirSync("public/maps", { recursive: true });
fs.writeFileSync("public/maps/europe-simplified.svg", svg);

console.log("Generated public/maps/europe-simplified.svg");