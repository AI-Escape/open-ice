import { Box, Link } from "@cloudscape-design/components";
import { useLayoutEffect, useRef, useState } from "react";
import useRecentExperiences from "../common/hooks/experiences";

export default function NewsBanner() {
  const [paused, setPaused] = useState(false);
  const { data: experiences = [] } = useRecentExperiences();

  // 1️⃣ duplicate the data so the tail meets the head
  const reel = [...experiences, ...experiences];

  // 2️⃣ measure the full width once data is ready
  const tickerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!tickerRef.current) return;
    const distance = tickerRef.current.scrollWidth / 2; // half, because duplicated
    const pxPerSec = 35;                                // <‑‑ tweak this ONE number
    const duration = distance / pxPerSec;
    tickerRef.current.style.setProperty("--ticker-duration", `${duration}s`);
  }, [experiences]);

  return (
    <div
      className={`news-bar ${paused ? "paused" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
    >
      <div
        ref={tickerRef}
        className={`ticker ${paused ? "paused" : ""}`}
      >
        {reel.map((exp, idx) => (
          <Box key={`${exp.uuid}-${idx}`} variant="p" color="inherit">
            “{exp.quote}”{" – "}
            <Link
              href={exp.source_url}
              target="_blank"
              rel="noopener noreferrer"
              color="inverted"
            >
              {exp.source_name}
            </Link>
          </Box>
        ))}
      </div>
    </div>
  );
}
