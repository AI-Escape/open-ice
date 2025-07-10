import { useMemo, useState } from 'react';
import { AverageStayLength, Criminality } from '../../common/types';
import {
  Box,
  ColumnLayout,
  Container,
  Form,
  Header,
  Link,
  SpaceBetween,
} from '@cloudscape-design/components';
import { CurrencyInput } from '../inputs/CurrencyInput';
import { RoundedInput } from '../inputs/RoundedInput';
import { formatCurrencyFriendly } from '../../common/formatting/formatCurrency';

export type EconomicImpactCalculatorProps = {
  defaultWage: number;
  defaultWeeklyWorkHours: number;
  employmentRate: number;
  taxRate: number;
  groupedData: Record<Criminality, AverageStayLength[]>;
  iceData: AverageStayLength[];
  cbpData: AverageStayLength[];
  averageDailyPopulation: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function EconomicImpactCalculator(props: EconomicImpactCalculatorProps) {
  const [weeklyWorkHours, setWeeklyWorkHours] = useState<number | undefined | null>(
    props.defaultWeeklyWorkHours,
  );

  const [hourlyWage, setHourlyWage] = useState<number | undefined | null>(props.defaultWage);

  const initialDetainedPeriod = useMemo(() => {
    const lastData = props.groupedData.Average[props.groupedData.Average.length - 1];
    if (!lastData) {
      return undefined;
    }
    return lastData.length_of_stay;
  }, [props.groupedData]);

  const iceDetainedPeriod = useMemo(() => {
    const lastData = props.iceData[props.iceData.length - 1];
    if (!lastData) {
      return undefined;
    }
    return lastData.length_of_stay;
  }, [props.iceData]);

  const cbpDetainedPeriod = useMemo(() => {
    const lastData = props.cbpData[props.cbpData.length - 1];
    if (!lastData) {
      return undefined;
    }
    return lastData.length_of_stay;
  }, [props.cbpData]);

  const [detainedPeriod, setDetainedPeriod] = useState<number | undefined | null>(
    initialDetainedPeriod,
  );

  const valueError = useMemo(() => {
    if (!weeklyWorkHours) {
      return 'Please enter a valid number of weekly work hours';
    }
    if (!hourlyWage) {
      return 'Please enter a valid hourly wage';
    }
    if (!detainedPeriod) {
      return 'Please enter a valid detained period';
    }
    if (weeklyWorkHours < 0) {
      return 'Please enter a valid number of weekly work hours';
    }
    if (hourlyWage < 0) {
      return 'Please enter a valid hourly wage';
    }
    if (detainedPeriod < 0) {
      return 'Please enter a valid detained period';
    }
    return undefined;
  }, [weeklyWorkHours, hourlyWage, detainedPeriod]);

  const totalIndividualCost = useMemo(() => {
    if (!weeklyWorkHours || !hourlyWage || !detainedPeriod) {
      return undefined;
    }
    const weeksMissed = detainedPeriod / 7;
    const hoursMissed = weeksMissed * weeklyWorkHours;
    const totalWage = hoursMissed * hourlyWage;
    return totalWage;
  }, [weeklyWorkHours, hourlyWage, detainedPeriod]);

  const totalYearlyCost = useMemo(() => {
    if (!totalIndividualCost) {
      return undefined;
    }
    if (!detainedPeriod) {
      return undefined;
    }
    if (!initialDetainedPeriod) {
      return undefined;
    }
    const uniqueDetainees = (props.averageDailyPopulation / initialDetainedPeriod) * 365.25;
    // scale unique detainees to the detained period linearly
    const scaledUniqueDetainees = uniqueDetainees * (detainedPeriod / initialDetainedPeriod);
    const workingDetainees = scaledUniqueDetainees * props.employmentRate;
    const yearlyCost = totalIndividualCost * workingDetainees;
    return yearlyCost;
  }, [totalIndividualCost, props.employmentRate, props.averageDailyPopulation, detainedPeriod]);

  const totalYearlyTaxCost = useMemo(() => {
    if (!totalYearlyCost) {
      return undefined;
    }
    return totalYearlyCost * props.taxRate;
  }, [totalYearlyCost, props.taxRate]);

  return (
    <Container
      header={
        <Header variant="h1" description="What does it cost to be detained?">
          <Box
            variant="span"
            color="text-status-info"
            fontSize="heading-xl"
            textAlign="center"
            fontWeight="bold"
          >
            <div>Economic Impact</div>
          </Box>
        </Header>
      }
      footer={
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h2" description="The cost of the detainee's missed wages.">
            Total Individual Cost
          </Header>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Box
              variant="span"
              color="text-status-error"
              fontSize="display-l"
              fontWeight="bold"
              textAlign="center"
            >
              {currencyFormatter.format(totalIndividualCost ?? 0)}
            </Box>
          </div>
          <Box variant="span" color="text-body-secondary">
            This is solely the cost of missed wages due to detention. It does not include the cost
            of hiring a lawyer, the cost of a bond, or the permanent, long-term cost of being
            deported.
          </Box>
          <hr />
          <Header variant="h2" description="The missed wages across all detainees, annually.">
            Total Yearly Cost
          </Header>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                variant="span"
                color="text-status-error"
                fontSize="display-l"
                fontWeight="bold"
                textAlign="center"
              >
                {formatCurrencyFriendly(totalYearlyCost ?? 0)}
              </Box>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                variant="span"
                color="text-status-warning"
                fontSize="heading-l"
                textAlign="center"
              >
                That's{' '}
                <Box
                  variant="span"
                  color="text-status-warning"
                  fontSize="heading-l"
                  fontWeight="bold"
                >
                  {formatCurrencyFriendly(totalYearlyTaxCost ?? 0)}
                </Box>{' '}
                annually in lost tax revenue
              </Box>
            </div>
          </div>
          <Box variant="span" color="text-body-secondary">
            This number assumes an employment rate of {props.employmentRate * 100}%, supported by
            the{' '}
            <Link href="https://www.epi.org/" target="_blank" rel="noopener noreferrer">
              Economic Policy Institute
            </Link>
            , an average daily detained population of{' '}
            {props.averageDailyPopulation.toLocaleString('en-US', { maximumFractionDigits: 0 })},
            supported by the data released by ICE, and an average tax revenue rate of{' '}
            {props.taxRate * 100}%, supported by various sources [
            <Link
              href="https://files.epi.org/uploads/FAQ-Unauthorized-Immigrants-v5-2.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              3
            </Link>
            ,{' '}
            <Link
              href="https://americansfortaxfairness.org/undocumented-immigrants-contribute-economy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              4
            </Link>
            ,{' '}
            <Link
              href="https://www.irs.gov/pub/irs-pdf/p926.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              5
            </Link>
            ,{' '}
            <Link
              href="https://itep.org/undocumented-immigrants-taxes-2024/"
              target="_blank"
              rel="noopener noreferrer"
            >
              6
            </Link>
            ].
          </Box>
        </SpaceBetween>
      }
    >
      <Form errorText={valueError}>
        <SpaceBetween direction="vertical" size="m">
          <ColumnLayout columns={2}>
            <RoundedInput
              initialValue={props.defaultWeeklyWorkHours}
              value={weeklyWorkHours}
              setValue={setWeeklyWorkHours}
              label="Hours Worked per Week"
              description="The number of hours the detainee works per week."
              precision={1}
              suffix=" hours"
              info={
                <Box variant="span" color="text-body-secondary">
                  Analysis of the{' '}
                  <Link
                    href="https://www.dol.gov/agencies/eta/national-agricultural-workers-survey"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    National Agricultural Workers Survey
                  </Link>{' '}
                  supports an average of {props.defaultWeeklyWorkHours.toFixed(1)} hours per week [
                  <Link
                    href="https://farmlabor.ucdavis.edu/sites/g/files/dgvnsk5936/files/inline-files/Ali%20Hill%3B%20US%20Labor%20Supply.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    1
                  </Link>
                  ,{' '}
                  <Link
                    href="https://www.dol.gov/sites/dolgov/files/ETA/naws/pdfs/NAWS%20Research%20Report%2017.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    2
                  </Link>
                  ].
                </Box>
              }
            />
            <CurrencyInput
              initialValue={props.defaultWage}
              value={hourlyWage}
              setValue={setHourlyWage}
              label="Hourly Wage"
              description="The hourly wage of the detainee."
              info={
                <Box variant="span" color="text-body-secondary">
                  Analysis of the{' '}
                  <Link
                    href="https://www.dol.gov/agencies/eta/national-agricultural-workers-survey"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    National Agricultural Workers Survey
                  </Link>{' '}
                  supports an average of {currencyFormatter.format(props.defaultWage)} per hour
                  (after adjusting for inflation) [
                  <Link
                    href="https://farmlabor.ucdavis.edu/sites/g/files/dgvnsk5936/files/inline-files/Ali%20Hill%3B%20US%20Labor%20Supply.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    1
                  </Link>
                  ,{' '}
                  <Link
                    href="https://www.dol.gov/sites/dolgov/files/ETA/naws/pdfs/NAWS%20Research%20Report%2017.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    2
                  </Link>
                  ].
                </Box>
              }
            />
            <RoundedInput
              initialValue={initialDetainedPeriod}
              value={detainedPeriod}
              setValue={setDetainedPeriod}
              label="Detention Period"
              description="The number of days the detainee is detained."
              precision={1}
              suffix=" days"
              info={
                <Box variant="span" color="text-body-secondary">
                  The average length of stay for a detainee is {initialDetainedPeriod?.toFixed(1)}{' '}
                  days, with the average for ICE being {iceDetainedPeriod?.toFixed(1)} days and CBP
                  being {cbpDetainedPeriod?.toFixed(1)} days. See above charts for more details.
                </Box>
              }
            />
          </ColumnLayout>
        </SpaceBetween>
      </Form>
    </Container>
  );
}
