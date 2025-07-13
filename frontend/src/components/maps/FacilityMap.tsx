import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import {
  SpaceBetween,
  Box,
  Header,
  Button,
  ExpandableSection,
} from '@cloudscape-design/components';
import { Facility } from '../../common/types';
import states from '../../data/states-10m.json';
import { getStateAbbreviation, getStateName } from '../../common/geo/states';
import { ThreatPieChart } from '../graphs/ThreatPieChart';
import useWindowDimensions from '../../common/window';

export type StateFacilities = {
  facilities: Facility[];
  totalPop: number;
  avgStay: number;
};

export type StateFacilityProps = {
  data: Facility[];
};

const MIN_POPUP_WIDTH = 220;
const MAX_POPUP_WIDTH = 500;
const MOBILE_BREAKPOINT = 640;
const EDGE_PADDING = 16;
const BOTTOM_EDGE_PADDING = 2;
const NEGATIVE_EDGE_PADDING = 16;

function hex(n: number): string {
  return Math.round(n).toString(16).padStart(2, '0');
}

function interpolateColor(value: number, max: number): string {
  if (max === 0) return '#96caff';
  const ratio = Math.max(0, Math.min(1, value / max));
  const stops = [
    [150, 202, 255], // light blue
    [80, 200, 120], // green
    [255, 165, 0], // orange
    [139, 0, 0], // dark red
  ];
  let start;
  let end;
  let t;
  if (ratio <= 1 / 3) {
    start = stops[0];
    end = stops[1];
    t = ratio / (1 / 3);
  } else if (ratio <= 2 / 3) {
    start = stops[1];
    end = stops[2];
    t = (ratio - 1 / 3) / (1 / 3);
  } else {
    start = stops[2];
    end = stops[3];
    t = (ratio - 2 / 3) / (1 / 3);
  }
  const r = start[0] + (end[0] - start[0]) * t;
  const g = start[1] + (end[1] - start[1]) * t;
  const b = start[2] + (end[2] - start[2]) * t;
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function lightenColor(color: string, amount: number): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const nr = r + (255 - r) * amount;
  const ng = g + (255 - g) * amount;
  const nb = b + (255 - b) * amount;
  return `#${hex(nr)}${hex(ng)}${hex(nb)}`;
}

// FacilityList: Expandable list of facilities
const FacilityList = React.memo(function FacilityList({ facilities }: { facilities: Facility[] }) {
  return (
    <ExpandableSection headerText={`${facilities.length} facilities`}>
      <div style={{ width: '100%' }}>
        {facilities.map((f: Facility) => (
          <div
            key={
              f.state +
              ' ' +
              f.name +
              ' ' +
              f.city +
              ' ' +
              (
                (f.ice_threat_level_1 ?? 0) +
                (f.ice_threat_level_2 ?? 0) +
                (f.ice_threat_level_3 ?? 0) +
                (f.no_ice_threat_level ?? 0)
              ).toLocaleString(undefined, { maximumFractionDigits: 0 })
            }
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ paddingRight: '8px', flex: 1 }}>
              <Box variant="span">{f.name}</Box>
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              <Box variant="span" color="text-body-secondary">
                {(
                  (f.ice_threat_level_1 ?? 0) +
                  (f.ice_threat_level_2 ?? 0) +
                  (f.ice_threat_level_3 ?? 0) +
                  (f.no_ice_threat_level ?? 0)
                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Box>
            </div>
          </div>
        ))}
      </div>
    </ExpandableSection>
  );
});

// FacilityPopup: The popup with all info, position, and close button
const FacilityPopup = React.memo(function FacilityPopup({
  popupState,
  popupPos,
  popupSide,
  popupWidth,
  stateData,
  locked,
  popupRef,
  mapRef,
  onClose,
}: {
  popupState: string;
  popupPos: { x: number; y: number };
  popupSide: 'right' | 'left' | 'bottom';
  popupWidth: number;
  stateData: StateFacilities | undefined;
  locked: boolean;
  popupRef: React.RefObject<HTMLDivElement>;
  mapRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < MOBILE_BREAKPOINT;
  const containerWidth = mapRef.current
    ? Math.min(windowWidth, mapRef.current.getBoundingClientRect().width)
    : windowWidth;
  const horizontalPadding = popupSide === 'bottom' ? BOTTOM_EDGE_PADDING * 2 : EDGE_PADDING * 2;
  const popupFullWidth = containerWidth - horizontalPadding;
  const maxPopupWidth = Math.min(MAX_POPUP_WIDTH, popupFullWidth);
  const minPopupWidth = Math.min(MIN_POPUP_WIDTH, popupFullWidth);
  const initialLeft =
    popupSide === 'right'
      ? popupPos.x + 32
      : popupSide === 'left'
        ? popupPos.x - popupWidth - 32
        : popupPos.x - popupWidth / 2;
  let left = initialLeft;
  let arrowLeft: number | string = '50%';
  if (popupSide === 'bottom' && mapRef.current) {
    const rect = mapRef.current.getBoundingClientRect();
    const padding = BOTTOM_EDGE_PADDING;
    if (isSmallScreen) {
      const adjusted = padding;
      const width = popupFullWidth;
      arrowLeft = Math.min(Math.max(popupPos.x - adjusted, 10), width - 10);
      left = adjusted;
    } else {
      const maxLeft = Math.min(rect.width, windowWidth) - popupWidth - padding;
      const minLeft = padding;
      const adjusted = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));
      arrowLeft = Math.min(Math.max(popupPos.x - adjusted, 10), popupWidth - 10);
      left = adjusted;
    }
  }
  return (
    <div
      ref={popupRef}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: left,
        top: popupSide === 'bottom' ? popupPos.y + 24 : popupPos.y - 24,
        minWidth: popupSide === 'bottom' && isSmallScreen ? popupFullWidth : minPopupWidth,
        maxWidth: popupSide === 'bottom' && isSmallScreen ? popupFullWidth : maxPopupWidth,
        width: popupSide === 'bottom' && isSmallScreen ? popupFullWidth : 'max-content',
        background: 'white',
        padding: 0,
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
        zIndex: 1000,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      {/* Chevron for all three positions */}
      {popupSide !== 'bottom' ? (
        <div
          style={{
            zIndex: 999,
            position: 'absolute',
            top: 24,
            left: popupSide === 'right' ? -11 : undefined,
            right: popupSide === 'left' ? -11 : undefined,
            width: 0,
            height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: popupSide === 'left' ? '12px solid white' : undefined,
            borderRight: popupSide === 'right' ? '12px solid white' : undefined,
            filter:
              popupSide === 'right'
                ? 'drop-shadow(-2px 0 2px #d1d5db)'
                : 'drop-shadow(2px 0 2px #d1d5db)',
          }}
        />
      ) : (
        <div
          style={{
            zIndex: 999,
            position: 'absolute',
            top: -10,
            left: arrowLeft,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '10px solid white',
            filter: 'drop-shadow(0 -2px 2px #d1d5db)',
          }}
        />
      )}
      <div style={{ padding: '16px' }}>
        <SpaceBetween direction="vertical" size="xs">
          <Header
            variant="h2"
            actions={locked && <Button variant="icon" iconName="close" onClick={onClose} />}
            description={
              <Box variant="span" fontSize="body-m" color="text-body-secondary">
                {stateData?.avgStay?.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                }) ?? '0.0'}{' '}
                days average stay
              </Box>
            }
          >
            {getStateName(popupState) ?? popupState}
          </Header>
          {stateData && <FacilityList facilities={stateData.facilities} />}
          {stateData && stateData.facilities.length > 0 && stateData.totalPop > 0 && (
            <div style={{ width: '100%' }}>
              <ThreatPieChart data={stateData.facilities} />
            </div>
          )}
          <hr style={{ width: '100%', borderRadius: '1px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Total</span>
            <span>
              {(stateData?.totalPop ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
              people
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Box variant="span" fontSize="body-s" color="text-body-secondary">
              The average daily population is the average number of people held in custody each day.
              Detainees are overwhelmingly non-criminal, and have not necessarily been convicted of
              any immigration violations while in custody.
            </Box>
          </div>
        </SpaceBetween>
      </div>
    </div>
  );
});

// FacilityMapGeographies: The map and geographies
const FacilityMapGeographies = React.memo(function FacilityMapGeographies({
  data,
  maxPop,
  locked,
  selectedState,
  setSelectedState,
  setLocked,
  setPos,
  mapRef,
  checkPopupSide,
}: {
  data: Record<string, StateFacilities>;
  maxPop: number;
  locked: { state: string; pos: { x: number; y: number } } | null;
  selectedState: string | null;
  setSelectedState: (s: string | null) => void;
  setLocked: (l: { state: string; pos: { x: number; y: number } } | null) => void;
  setPos: (p: { x: number; y: number }) => void;
  mapRef: React.RefObject<HTMLDivElement>;
  checkPopupSide: (x: number) => void;
}) {
  return (
    <ComposableMap projection="geoAlbersUsa" height={500}>
      <Geographies geography={states}>
        {({ geographies }: { geographies: any[] }) =>
          geographies.map((geo) => {
            const state = geo.properties.name;
            const abbrev = getStateAbbreviation(state);
            if (!abbrev) {
              return null;
            }
            const pop = data[abbrev] ? data[abbrev].totalPop : 0;
            const color = interpolateColor(pop, maxPop);
            const lightColor = lightenColor(color, 0.5);
            let geoStyle;
            if (locked) {
              if (locked.state === abbrev) {
                geoStyle = {
                  default: { fill: color, stroke: '#FFFFFF', strokeWidth: 2.0 },
                  hover: { fill: color, stroke: '#FFFFFF', strokeWidth: 2.0 },
                  pressed: { fill: color, stroke: '#FFFFFF', strokeWidth: 2.0 },
                };
              } else {
                geoStyle = {
                  default: { fill: lightColor, stroke: '#FFFFFF', strokeWidth: 0.5 },
                  hover: { fill: lightColor, stroke: '#FFFFFF', strokeWidth: 0.5 },
                  pressed: { fill: lightColor, stroke: '#FFFFFF', strokeWidth: 0.5 },
                };
              }
            } else {
              geoStyle = {
                default: { fill: lightColor, stroke: '#FFFFFF', strokeWidth: 0.5 },
                hover: { fill: color, stroke: '#FFFFFF', strokeWidth: 2.0 },
                pressed: { fill: color, stroke: '#FFFFFF', strokeWidth: 2.0 },
              };
            }

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onPointerEnter={
                  locked
                    ? undefined
                    : (e: React.PointerEvent<SVGPathElement>) => {
                        if (e.pointerType !== 'mouse') return;
                        setSelectedState(abbrev);
                        if (mapRef.current) {
                          const rect = mapRef.current.getBoundingClientRect();
                          const relX = e.clientX - rect.left;
                          const relY = e.clientY - rect.top;
                          setPos({ x: relX, y: relY });
                          checkPopupSide(relX);
                        }
                      }
                }
                onPointerMove={
                  locked
                    ? undefined
                    : (e: React.PointerEvent<SVGPathElement>) => {
                        if (e.pointerType !== 'mouse') return;
                        if (mapRef.current) {
                          const rect = mapRef.current.getBoundingClientRect();
                          const relX = e.clientX - rect.left;
                          const relY = e.clientY - rect.top;
                          setPos({ x: relX, y: relY });
                          checkPopupSide(relX);
                        }
                      }
                }
                onPointerLeave={
                  locked
                    ? undefined
                    : (e: React.PointerEvent<SVGPathElement>) => {
                        if (e.pointerType !== 'mouse') return;
                        setSelectedState(null);
                      }
                }
                onClick={(e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
                  if (mapRef.current) {
                    const rect = mapRef.current.getBoundingClientRect();
                    const relX = e.clientX - rect.left;
                    const relY = e.clientY - rect.top;
                    setLocked({ state: abbrev, pos: { x: relX, y: relY } });
                    setSelectedState(null);
                    checkPopupSide(relX);
                  }
                }}
                tabIndex={0}
                style={geoStyle}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
});

export function FacilityMap(props: StateFacilityProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ state: string; pos: { x: number; y: number } } | null>(
    null,
  );
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [popupSide, setPopupSide] = useState<'right' | 'left' | 'bottom'>('right');
  const mapRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const popupRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [popupWidth, setPopupWidth] = useState<number>(0);

  const data = useMemo(() => {
    const grouped: Record<string, StateFacilities> = {};
    for (const f of props.data) {
      const key = f.state;
      if (!grouped[key]) {
        grouped[key] = { facilities: [], totalPop: 0, avgStay: 0 };
      }
      grouped[key].facilities.push(f);
      grouped[key].totalPop +=
        (f.ice_threat_level_1 ?? 0) +
        (f.ice_threat_level_2 ?? 0) +
        (f.ice_threat_level_3 ?? 0) +
        (f.no_ice_threat_level ?? 0);
      grouped[key].avgStay += f.fy25_alos ?? 0;
    }
    for (const key in grouped) {
      if (grouped[key].facilities.length > 0) {
        grouped[key].avgStay /= grouped[key].facilities.length;
      }
      grouped[key].facilities.sort(
        (a, b) =>
          (b.ice_threat_level_1 ?? 0) +
          (b.ice_threat_level_2 ?? 0) +
          (b.ice_threat_level_3 ?? 0) +
          (b.no_ice_threat_level ?? 0) -
          (a.ice_threat_level_1 ?? 0) -
          (a.ice_threat_level_2 ?? 0) -
          (a.ice_threat_level_3 ?? 0) -
          (a.no_ice_threat_level ?? 0),
      );
    }
    return grouped;
  }, [props.data]);

  const maxPop = useMemo(() => {
    const values = Object.values(data).map((d) => d.totalPop);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [data]);

  // Memoize handlers
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < MOBILE_BREAKPOINT;

  const checkPopupSide = useCallback(
    (x: number) => {
      if (isSmallScreen) {
        setPopupSide('bottom');
        return;
      }
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        const maxWidth = Math.min(MAX_POPUP_WIDTH, windowWidth - 32);
        const minWidth = Math.min(MIN_POPUP_WIDTH, windowWidth - 32);
        if (x + maxWidth > rect.width - 16 && x - minWidth < 16) {
          setPopupSide('bottom');
        } else if (x + maxWidth > rect.width - 16) {
          setPopupSide('left');
        } else {
          setPopupSide('right');
        }
      }
    },
    [isSmallScreen, windowWidth],
  );

  // Update popup width after render
  useEffect(() => {
    if (popupRef.current && mapRef.current) {
      const width = popupRef.current.offsetWidth;
      setPopupWidth(width);
      const rect = mapRef.current.getBoundingClientRect();
      let left = 0;
      const popupState = locked ? locked.state : selectedState;
      const popupPos = locked ? locked.pos : pos;
      if (popupSide === 'right') {
        left = popupPos.x;
      } else if (popupSide === 'left') {
        left = popupPos.x - width;
      }
      const EDGE_BUFFER = 0;
      if (isSmallScreen) {
        setPopupSide('bottom');
      } else if (
        (popupSide === 'right' || popupSide === 'left') &&
        (left < EDGE_BUFFER || left + width > rect.width - EDGE_BUFFER)
      ) {
        setPopupSide('bottom');
      }
    }
  }, [locked, selectedState, data, popupSide, pos.x, isSmallScreen]);

  // Click-away listener to close popup if locked and click is outside
  useEffect(() => {
    if (!locked) return;
    function handleClick(e: MouseEvent | PointerEvent) {
      if (popupRef.current) {
        const target = e.target as Node;
        const path = (e as any).composedPath?.() as Node[] | undefined;
        const inPopup =
          popupRef.current.contains(target) || (path ? path.includes(popupRef.current) : false);
        if (!inPopup) {
          setLocked(null);
        }
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [locked]);

  const popupState = locked ? locked.state : selectedState;
  const popupPos = locked ? locked.pos : pos;
  const stateData = popupState ? data[popupState] : undefined;

  return (
    <div ref={mapRef} style={{ position: 'relative' }}>
      <FacilityMapGeographies
        data={data}
        maxPop={maxPop}
        locked={locked}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        setLocked={setLocked}
        setPos={setPos}
        mapRef={mapRef}
        checkPopupSide={checkPopupSide}
      />
      {popupState && (
        <FacilityPopup
          popupState={popupState}
          popupPos={popupPos}
          popupSide={popupSide}
          popupWidth={popupWidth}
          stateData={stateData}
          locked={!!locked}
          popupRef={popupRef}
          mapRef={mapRef}
          onClose={() => setLocked(null)}
        />
      )}
    </div>
  );
}

export default FacilityMap;
