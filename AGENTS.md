# Agent Guidelines

This repository contains three main areas as described in the main README:

- `backend/` – FastAPI service and related scripts
- `frontend/` – React + TypeScript client
- `infrastructure/` – AWS CDK stacks

Each directory has its own README with setup details.

## Coding Style

### Backend (FastAPI)

- Python 3.13
- Package manager is `pip`, be sure to install dependencies with `pip install -r api/requirements.txt` before development
- Use async functions where possible
- 4 spaces per indent
- Keep lines under 80 characters
- Use type hints for all functions and variables where possible
- Use `SQLModel` for database models, do not manually create migration files
  - Do not worry about migrating the database yourself, we will use `alembic` to do this when we deploy the application
- Any new tables should be added to the `models.py` file
  - Create a new base model class for the table with all the common fields
  - Then create a `table=True` model class for the table with all the `Field`s, foreign keys, relationships, etc.
  - Finally, create a `Read` class that inherits from the base model class when you want to read from the table and send back results with FastAPI. Any relationships must be included in the `Read` class explicitly, and in the `SQLModel` `select` statement they must be `selectinload`ed for them to be included in the results.
- Format in style with `black -l 79` before committing
- All backend processes are managed in Docker containers, and are run in the `docker-compose.yml` file

### Frontend (React/TypeScript)

- Package manager is `npm`, be sure to install dependencies with `npm install` before development
- Build tool is Vite with React Compiler enabled
- Use the Prettier rules in `.prettierrc` (single quotes, trailing commas, width 100)
- ESLint configuration lives in `eslint.config.js` (flat config format)
- Components are written in TypeScript using React hooks
- Explicitly define the types for all props and state in the component
- Prefer named function exports for React components instead of `React.FC`.
  Each component should be declared as `export function ComponentName(props: ComponentNameProps): JSX.Element`.
  
  ```tsx
  export type ExampleProps = {
    title: string;
  };

  export function Example(props: ExampleProps): JSX.Element {
    return <h1>{props.title}</h1>;
  }
  ```
- Tailwind CSS is used for styling
- Primary framework is `cloudscape-design` by AWS. See `https://cloudscape.design/components/` for library reference, as well as existing code
- Ensure the project compiles with `tsc` before committing

### Infrastructure

- TypeScript AWS CDK project

