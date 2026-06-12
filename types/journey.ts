export type Stop = {
  id: number;
  city: string;
  country_name: string;
  country_code: string;
  lat: number | string;
  lng: number | string;
  km_total: number;
  day_number: number;
};

export type Article = {
  id: number;
  title: string;
  startStopId: number;
  endStopId: number;
  text_orign?: string;
  text_ia_v1?: string;
  guestStory?: GuestStory;
};

export type ProjectedStop = Stop & {
  latNum: number;
  lngNum: number;
  x: number;
  y: number;
};

export type PointWithDistance = ProjectedStop & {
  pathDistance: number;
};

export type MapView = {
  x: number;
  y: number;
  zoom: number;
};

export type GuestStory = {
  author: string;
  text: string;
};