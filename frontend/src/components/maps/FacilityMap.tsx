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

const COLOR_RAMP = ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26', '#a50f15'];
const NO_DATA_COLOR = '#f7f7f7';

function hex(n: number): string {
  return Math.round(n).toString(16).padStart(2, '0');
}

function getThresholds(max: number): number[] {
  if (max <= 0) return [];
  const logMax = Math.log10(max + 1);
  const step = logMax / COLOR_RAMP.length;
  return Array.from({ length: COLOR_RAMP.length }, (_, i) => Math.pow(10, step * (i + 1)) - 1);
}

function getColor(value: number, thresholds: number[]): string {
  if (value === 0) return NO_DATA_COLOR;
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) {
      return COLOR_RAMP[i];
    }
  }
  return COLOR_RAMP[COLOR_RAMP.length - 1];
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
  const containerWidth = useMemo(() => {
    try {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        return Math.min(windowWidth, rect.width);
      }
      return windowWidth;
    } catch (e) {
      // don't care if mapRef.current is null if there's a race condition and it switches while checking, just return windowWidth
      return windowWidth;
    }
  }, [mapRef.current, windowWidth]);

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
  const { left, arrowLeft } = useMemo(() => {
    let left = initialLeft;
    let arrowLeft: number | string = '50%';
    
    if (popupSide === 'bottom') {
      try {
        if (mapRef.current) {
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
      } catch (e) {
        // don't care if mapRef.current is null if there's a race condition, just use default values
        left = initialLeft;
        arrowLeft = '50%';
      }
    }
    
    return { left, arrowLeft };
  }, [popupSide, initialLeft, popupPos.x, popupWidth, popupFullWidth, isSmallScreen, windowWidth, mapRef.current]);
  
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
  thresholds,
  locked,
  selectedState,
  setSelectedState,
  setLocked,
  setPos,
  mapRef,
  checkPopupSide,
}: {
  data: Record<string, StateFacilities>;
  thresholds: number[];
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
            const color = getColor(pop, thresholds);
            const highlightState = locked ? locked.state : selectedState;
            const faded = lightenColor(color, 0.5);
            const isDim = highlightState && highlightState !== abbrev;
            const geoStyle = {
              default: {
                fill: isDim ? faded : color,
                stroke: '#FFFFFF',
                strokeWidth: highlightState === abbrev ? 2.0 : 0.5,
              },
              hover: { fill: color, stroke: '#FFFFFF', strokeWidth: 2.0 },
              pressed: { fill: color, stroke: '#FFFFFF', strokeWidth: 2.0 },
            };

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
                        try {
                          const rect = mapRef.current?.getBoundingClientRect();
                          if (rect) {
                            const relX = e.clientX - rect.left;
                            const relY = e.clientY - rect.top;
                            setPos({ x: relX, y: relY });
                            checkPopupSide(relX);
                          }
                        } catch (e) {
                          // just don't do anything if there's a race condition and mapRef.current is null
                          console.info('race condition and mapRef.current is null in onPointerEnter');
                        }
                      }
                }
                onPointerMove={
                  locked
                    ? undefined
                    : (e: React.PointerEvent<SVGPathElement>) => {
                        if (e.pointerType !== 'mouse') return;
                        try {
                          const rect = mapRef.current?.getBoundingClientRect();
                          if (rect) {
                            const relX = e.clientX - rect.left;
                            const relY = e.clientY - rect.top;
                            setPos({ x: relX, y: relY });
                            checkPopupSide(relX);
                          }
                        } catch (e) {
                          // just don't do anything if there's a race condition and mapRef.current is null
                          console.info('race condition and mapRef.current is null in onPointerMove');
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
                  try {
                    const rect = mapRef.current?.getBoundingClientRect();
                    if (rect) {
                      const relX = e.clientX - rect.left;
                      const relY = e.clientY - rect.top;
                      setLocked({ state: abbrev, pos: { x: relX, y: relY } });
                      setSelectedState(null);
                      checkPopupSide(relX);
                    }
                  } catch (e) {
                    // just don't do anything if there's a race condition and mapRef.current is null
                    console.info('race condition and mapRef.current is null in onClick');
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

const MapLegend = React.memo(function MapLegend({ thresholds }: { thresholds: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const labels = useMemo(() => {
    if (thresholds.length === 0) return [];
    const cuts: string[] = ['0'];
    for (let i = 0; i < thresholds.length; i++) {
      const start = i === 0 ? 1 : thresholds[i - 1] + 1;
      const end = thresholds[i];
      cuts.push(`${start.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}\u2013${end.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`);
    }
    return cuts;
  }, [thresholds]);

  const segmentWidth = 100 / (thresholds.length + 1);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center relative w-full mt-2 gap-2"
    >
      <Header variant="h3" description="Log scale of average daily detained population">
        Average Daily Detained Population
      </Header>
      <svg width="100%" height="22" style={{ display: 'block' }}>
        {[NO_DATA_COLOR, ...COLOR_RAMP].map((color, i) => (
          <rect
            key={i}
            x={`${segmentWidth * i}%`}
            y={0}
            width={`${segmentWidth}%`}
            height={16}
            fill={color}
            stroke={'#ccc'}
            strokeWidth={1}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', width: '100%', fontSize: '12px' }}>
        {labels.map((label, i) => (
          <div
            key={i}
            style={{
              width: `${segmentWidth}%`,
              textAlign: 'center',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
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
      const totalPop = (f.ice_threat_level_1 ?? 0) +
      (f.ice_threat_level_2 ?? 0) +
      (f.ice_threat_level_3 ?? 0) +
      (f.no_ice_threat_level ?? 0)
      grouped[key].totalPop += totalPop;
      // average stay * population = total stay days, then we 
      // divide by total population to get average stay for the state
      grouped[key].avgStay += (f.fy25_alos ?? 0) * totalPop;
    }
    for (const key in grouped) {
      if (grouped[key].totalPop > 0) {
        grouped[key].avgStay /= grouped[key].totalPop;
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

  const thresholds = useMemo(() => getThresholds(maxPop), [maxPop]);

  // Memoize handlers
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < MOBILE_BREAKPOINT;

  const checkPopupSide = useCallback(
    (x: number) => {
      if (isSmallScreen) {
        setPopupSide('bottom');
        return;
      }
      try {
        const rect = mapRef.current?.getBoundingClientRect();
        if (rect) {
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
      } catch (e) {
        // just don't do anything if there's a race condition and mapRef.current is null
      }
    },
    [isSmallScreen, windowWidth],
  );

  // Update popup width after render
  useEffect(() => {
    try {
      const popupCurrent = popupRef.current;
      const mapCurrent = mapRef.current;
      if (popupCurrent && mapCurrent) {
        const width = popupCurrent.offsetWidth;
        setPopupWidth(width);
        const rect = mapCurrent.getBoundingClientRect();
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
    } catch (e) {
      // just don't do anything if there's a race condition and mapRef.current is null or popupRef.current is null inside the try block
    }
  }, [locked, selectedState, data, popupSide, pos.x, isSmallScreen]);

  // Click-away listener to close popup if locked and click is outside
  useEffect(() => {
    if (!locked) return;
    function handleClick(e: MouseEvent | PointerEvent) {
      try {
        const popupCurrent = popupRef.current;
        if (popupCurrent) {
          const target = e.target as Node;
          const path = (e as any).composedPath?.() as Node[] | undefined;
          const inPopup =
            popupCurrent.contains(target) || (path ? path.includes(popupCurrent) : false);
          if (!inPopup) {
            setLocked(null);
          }
        }
      } catch (e) {
        // just don't do anything if there's a race condition and popupRef.current is null
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [locked]);

  const popupState = locked ? locked.state : selectedState;
  const popupPos = locked ? locked.pos : pos;
  const stateData = popupState ? data[popupState] : undefined;

  return (
    <div style={{ width: '100%' }}>
      <div ref={mapRef} style={{ position: 'relative' }}>
        <FacilityMapGeographies
          data={data}
          thresholds={thresholds}
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
      <MapLegend thresholds={thresholds} />
    </div>
  );
}

export default FacilityMap;
