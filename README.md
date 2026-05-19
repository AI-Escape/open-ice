# OpenICE

OpenICE is an independent data transparency project tracking U.S. Immigration and Customs Enforcement (ICE) detention statistics. The project is developed by [AI Escape](https://aiescape.io) and is not affiliated with or endorsed by any government agency. All data is sourced from publicly available ICE reports and may not reflect the most current information.

## Repository Overview

This repository contains three main parts:

| Directory | Description |
|-----------|-------------|
| [`backend/`](backend/) | FastAPI service that ingests Excel reports and exposes a JSON API. Contains Docker configuration and scripts for data import. |
| [`frontend/`](frontend/) | React application built with Yarn and Tailwind CSS for visualizing detention statistics. |
| [`infrastructure/`](infrastructure/) | AWS CDK project that defines the infrastructure to host the API and website. |

Each subdirectory provides its own `README.md` with detailed setup instructions.

## Quick Start

1. Clone the repository

   ```bash
   git clone https://github.com/AI-Escape/open-ice.git
   cd open-ice
   ```

2. Follow the setup guides in the [`backend`](backend/README.md) and [`frontend`](frontend/README.md) folders to run the API and web application locally. Docker and Node.js are required.

3. Infrastructure deployment uses the AWS CDK. See [`infrastructure/README.md`](infrastructure/README.md) for commands to synthesize and deploy.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests. By participating in this project you agree to abide by the code of conduct defined in the individual directories.

## Production Releases

Production deploy workflows publish canonical GitHub Releases only after a
production deploy succeeds. The release tag is `prod-<full commit SHA>`, so
rerunning the same deploy updates the existing release instead of creating a
duplicate.

Each release records the deployed production SHA, the service URL, the GitHub
Actions run URL, and deploy notes for each service that deployed from that
commit. Historical releases are not backfilled unless the production
SHA-to-deploy mapping is unambiguous under this policy.

## License

This project is licensed under the [Apache License 2.0](LICENSE). All code is open‑source. No public funds were used in its development.
