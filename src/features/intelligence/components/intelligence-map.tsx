"use client";

import { useMemo, useState } from "react";
import { MapPinOff } from "lucide-react";

import provinceGeoJson from "../../../../public/maps/indonesia-provinces.geo.json";

import {
  getCoverageMapState,
  getMappableLocations,
} from "../lib/intelligence-dashboard";
import type {
  IntelligenceCommoditySlug,
  PublicIntelligenceCoverage,
  PublicIntelligenceLocation,
} from "../types/dashboard";

type Position = [number, number];
type ProvinceGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: Position[][] | Position[][][];
};
type ProvinceFeature = {
  id: string;
  properties: {
    regionCode: string;
    regionName: string;
    regionLevel: "province";
  };
  geometry: ProvinceGeometry;
};
type ProvinceMapAsset = { features: ProvinceFeature[] };

const provinceFeatures = (provinceGeoJson as unknown as ProvinceMapAsset)
  .features;
const mapBounds = {
  minLongitude: 94.5,
  maxLongitude: 141.5,
  minLatitude: -11.5,
  maxLatitude: 6.5,
  width: 1000,
  height: 400,
};

function project([longitude, latitude]: Position): Position {
  return [
    ((longitude - mapBounds.minLongitude) /
      (mapBounds.maxLongitude - mapBounds.minLongitude)) *
      mapBounds.width,
    ((mapBounds.maxLatitude - latitude) /
      (mapBounds.maxLatitude - mapBounds.minLatitude)) *
      mapBounds.height,
  ];
}

function ringToPath(ring: Position[]) {
  return ring
    .map((position, index) => {
      const [x, y] = project(position);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function geometryToPath(geometry: ProvinceGeometry) {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates as Position[][]]
      : (geometry.coordinates as Position[][][]);
  return polygons
    .flatMap((polygon) => polygon.map((ring) => `${ringToPath(ring)} Z`))
    .join(" ");
}

function collectPositions(geometry: ProvinceGeometry) {
  const positions: Position[] = [];
  const walk = (coordinates: unknown) => {
    if (!Array.isArray(coordinates)) return;
    if (
      coordinates.length >= 2 &&
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      positions.push(coordinates as Position);
      return;
    }
    coordinates.forEach(walk);
  };
  walk(geometry.coordinates);
  return positions;
}

function getFeatureViewBox(feature: ProvinceFeature | undefined) {
  if (!feature) return `0 0 ${mapBounds.width} ${mapBounds.height}`;
  const projected = collectPositions(feature.geometry).map(project);
  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 24);
  const height = Math.max(maxY - minY, 24);
  const padding = Math.max(width, height) * 0.22;
  return `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
}

function isActivationKey(key: string) {
  return key === "Enter" || key === " ";
}

export function IntelligenceLocationMap({
  coverage,
  commoditySlug,
  locations,
  color,
  activeCoverageId,
  onCoverageSelect,
}: {
  coverage: PublicIntelligenceCoverage[];
  commoditySlug: IntelligenceCommoditySlug;
  locations: PublicIntelligenceLocation[];
  color: string;
  activeCoverageId: string | null;
  onCoverageSelect: (coverageId: string) => void;
}) {
  const [hoveredRegionCode, setHoveredRegionCode] = useState<string | null>(
    null,
  );
  const mappable = useMemo(() => getMappableLocations(locations), [locations]);
  const coverageMapState = useMemo(
    () => getCoverageMapState(coverage, activeCoverageId, commoditySlug),
    [activeCoverageId, commoditySlug, coverage],
  );
  const coverageByCode = useMemo(
    () =>
      new Map(
        coverageMapState.renderable.map((item) => [item.region.code, item]),
      ),
    [coverageMapState.renderable],
  );
  const activeFeature = provinceFeatures.find(
    (feature) =>
      feature.properties.regionCode === coverageMapState.activeRegionCode,
  );
  const viewBox = getFeatureViewBox(activeFeature);

  return (
    <div className="min-w-0 space-y-3">
      <figure
        data-map-base="indonesia-administrative"
        className="relative min-h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050e1c] sm:min-h-96"
      >
        <svg
          aria-label="Peta administratif Indonesia dan cakupan wilayah Intelligence"
          className="h-72 w-full touch-pan-y sm:h-96"
          role="img"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          <title>Peta administratif Indonesia</title>
          {provinceFeatures.map((feature) => {
            const coverageItem = coverageByCode.get(
              feature.properties.regionCode,
            );
            const isSelected =
              feature.properties.regionCode ===
              coverageMapState.activeRegionCode;
            const isHovered =
              feature.properties.regionCode === hoveredRegionCode;
            return (
              <path
                key={feature.id}
                d={geometryToPath(feature.geometry)}
                fill={coverageItem ? color : "#102940"}
                fillOpacity={
                  coverageItem
                    ? isSelected
                      ? 0.72
                      : isHovered
                        ? 0.54
                        : 0.38
                    : 0.92
                }
                stroke={coverageItem ? color : "#52708e"}
                strokeWidth={isSelected ? 2.6 : coverageItem ? 1.5 : 0.9}
                vectorEffect="non-scaling-stroke"
                className={
                  coverageItem
                    ? "cursor-pointer outline-none transition-[fill-opacity,stroke-width] focus-visible:stroke-white motion-reduce:transition-none"
                    : undefined
                }
                role={coverageItem ? "button" : undefined}
                tabIndex={coverageItem ? 0 : undefined}
                aria-label={
                  coverageItem
                    ? `Pilih wilayah ${coverageItem.region.name}`
                    : undefined
                }
                onClick={
                  coverageItem
                    ? () => onCoverageSelect(coverageItem.id)
                    : undefined
                }
                onKeyDown={
                  coverageItem
                    ? (event) => {
                        if (isActivationKey(event.key)) {
                          event.preventDefault();
                          onCoverageSelect(coverageItem.id);
                        }
                      }
                    : undefined
                }
                onMouseEnter={
                  coverageItem
                    ? () => setHoveredRegionCode(feature.properties.regionCode)
                    : undefined
                }
                onMouseLeave={
                  coverageItem ? () => setHoveredRegionCode(null) : undefined
                }
              >
                <title>
                  {coverageItem
                    ? `${feature.properties.regionName} — wilayah coverage ${commoditySlug}`
                    : feature.properties.regionName}
                </title>
              </path>
            );
          })}

          {mappable.map((location) => {
            const [x, y] = project([location.longitude!, location.latitude!]);
            return (
              <g key={location.id} aria-label={location.siteName} role="img">
                <title>{`${location.siteName} — ${location.region.name}`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r={location.isPrimary ? 7 : 5}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>

        <figcaption className="absolute bottom-2 right-2 rounded-full border border-white/10 bg-[#041020]/90 px-3 py-1 text-[10px] text-[#8fa0b4] backdrop-blur-sm">
          Batas provinsi: denyherianto · CC BY 4.0
        </figcaption>
      </figure>

      {mappable.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-[#061122] px-4 py-3 text-sm leading-6 text-[#8fa0b4]">
          <MapPinOff
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-brand-cyan"
          />
          <p>Koordinat lokasi tambang terverifikasi belum tersedia.</p>
        </div>
      ) : null}

      {coverage.length > coverageMapState.renderable.length ? (
        <p className="text-xs leading-5 text-[#78899d]">
          Coverage kabupaten/kota tetap tercantum pada daftar, tetapi tidak
          diganti dengan arsiran provinsi atau titik centroid.
        </p>
      ) : null}
    </div>
  );
}
