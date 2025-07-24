import { Box, Link } from '@cloudscape-design/components';
import { useState } from 'react';
import useRecentExperiences from '../common/hooks/experiences';

export default function Footer() {
  const [paused, setPaused] = useState(false);
  const experiencesQuery = useRecentExperiences();

  const experiences = experiencesQuery.data || [];

  return (
    <>
      <div
        className={`news-bar ${paused ? 'paused' : ''}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        tabIndex={0}
      >
        <div className={`ticker ${paused ? 'paused' : ''}`}>
          {experiences.map((exp) => (
            <span key={exp.uuid} className="mx-4">
              “{exp.quote}” -{' '}
              <a
                href={exp.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {exp.source_name}
              </a>
            </span>
          ))}
        </div>
      </div>
      <footer role="contentinfo" className="flex justify-center items-end w-full p-4 mt-10 pb-16">
      <Box variant="p" textAlign="center" color="text-status-inactive" fontSize="body-s">
        <Box variant="p" textAlign="center" color="text-status-inactive" fontSize="body-s">
          Copyright © {new Date().getFullYear()} AI Escape LLC. All rights reserved.
        </Box>

        <Box variant="p" textAlign="center" color="text-status-inactive" fontSize="body-s">
          OpenICE is an independent data transparency project developed by{' '}
          <Link
            href="https://aiescape.io"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="inherit"
          >
            AI Escape
          </Link>
          , a technology firm focused on ethical AI applications. It is not affiliated with or
          endorsed by any government agency. No public funds were used in its development.
        </Box>

        <Box variant="p" textAlign="center" color="text-status-inactive" fontSize="body-s">
          All code is open-source and available on{' '}
          <Link
            href="https://github.com/AI-Escape/open-ice"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="inherit"
          >
            GitHub
          </Link>
          . Licensed under the{' '}
          <Link
            href="https://github.com/AI-Escape/open-ice/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="inherit"
          >
            Apache License 2.0
          </Link>
          .
        </Box>

        <Box variant="p" textAlign="center" color="text-status-inactive" fontSize="body-s">
          Data is provided publicly by{' '}
          <Link
            href="https://www.ice.gov/detain/detention-management"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="inherit"
          >
            U.S. Immigration and Customs Enforcement (ICE)
          </Link>
          , and may not reflect the most current information. Interpretations are solely those of
          the project authors.
        </Box>

        <Box variant="p" textAlign="center" color="text-status-inactive" fontSize="body-s">
          Monitor platform uptime and service health at{' '}
          <Link
            href="https://status.openice.org/"
            target="_blank"
            rel="noopener noreferrer"
            fontSize="inherit"
          >
            status.openice.org
          </Link>
          .
        </Box>

        <Box variant="p" textAlign="center" color="text-status-inactive" fontSize="body-s">
          Questions or feedback?{' '}
          <Link href="mailto:contact@aiescape.io" fontSize="inherit">
            Contact us
          </Link>
          .
        </Box>
      </Box>
    </footer>
    </>
  );
}
