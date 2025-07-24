import { Box, Container, Header, SpaceBetween } from "@cloudscape-design/components";
import { Facility } from "../../common/types";
import FacilityMap from "../maps/FacilityMap";
import MajorHeader from "../MajorHeader";


export type FacilityStatsProps = {
  data: Facility[];
}

export function FacilityStats(props: FacilityStatsProps) {
  return (
    <SpaceBetween direction="vertical" size="m">
      <MajorHeader description="Where are detainees being held?">
        Detention Facility Map
      </MajorHeader>
    <FacilityMap data={props.data} />
  </SpaceBetween>
  );
}
