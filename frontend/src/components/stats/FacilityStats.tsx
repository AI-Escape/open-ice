import { Box, Container, Header } from "@cloudscape-design/components";
import { Facility } from "../../common/types";
import FacilityMap from "../maps/FacilityMap";


export type FacilityStatsProps = {
  data: Facility[];
}

export function FacilityStats(props: FacilityStatsProps) {
  return (
    <Container header={
    
      <Header variant="h1" description="Where are detainees being held?">
        <Box
          variant="span"
          color="text-status-info"
          fontSize="heading-xl"
          textAlign="center"
          fontWeight="bold"
        >
          <div>Detention Facility Map</div>
        </Box>
      </Header> 
    
    }>
      <FacilityMap data={props.data} />
    </Container>
  );
}
