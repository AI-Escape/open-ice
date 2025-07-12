import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { SpaceBetween, Box } from '@cloudscape-design/components';
import { getCurrentFacilities } from '../../common/api/facilities';
import { Facility } from '../../common/types';
import states from '../../data/states-10m.json';

interface StateFacilities {
  facilities: Facility[];
  totalPop: number;
}

const FacilityMap: React.FC = () => {
  const [data, setData] = useState<Record<string, StateFacilities>>({});
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    async function load() {
      const facilities = await getCurrentFacilities();
      const grouped: Record<string, StateFacilities> = {};
      facilities.forEach((f) => {
        const key = f.state;
        if (!grouped[key]) grouped[key] = { facilities: [], totalPop: 0 };
        grouped[key].facilities.push(f);
        grouped[key].totalPop += f.fy25_alos;
      });
      setData(grouped);
    }
    load();
  }, []);

  return (
    <div>
      <ComposableMap projection="geoAlbersUsa" width={800} height={500}>
        <Geographies geography={states as any}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={(e: React.MouseEvent) => {
                  setSelectedState(geo.properties.name);
                  setPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setSelectedState(null)}
                style={{
                  default: { fill: '#DDD', stroke: '#FFF', strokeWidth: 0.5 },
                  hover: { fill: '#888', stroke: '#FFF', strokeWidth: 0.5 },
                  pressed: { fill: '#444' },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
      {selectedState && data[selectedState] && (
        <div
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            background: 'white',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          <SpaceBetween size="xs">
            <Box fontWeight="bold">{selectedState}</Box>
            {data[selectedState].facilities.map((f) => (
              <Box key={f.name}>{`${f.name} – ${f.fy25_alos}`}</Box>
            ))}
            <Box fontWeight="bold">{`Total: ${data[selectedState].totalPop.toFixed(2)}`}</Box>
          </SpaceBetween>
        </div>
      )}
    </div>
  );
};

export default FacilityMap;
