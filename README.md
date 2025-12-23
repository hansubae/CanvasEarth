# Canvas Earth

An interactive collage board service where users can freely place images, text, and YouTube videos on an infinite 2D canvas with real-time collaboration.

## Project Overview

- **Project Name**: Canvas Earth (tentative)
- **Core Concept**: An infinite 2D canvas where users can freely arrange images, text, and YouTube videos, interacting in real-time
- **Goal**: Provide a Figma/Miro-like UX in an open-world game format accessible to everyone

## Tech Stack

### Backend
- **Language**: Java 17+
- **Framework**: Spring Boot 3.x
- **Build Tool**: Gradle
- **Database**: PostgreSQL (with PostGIS extension for spatial queries)
- **ORM**: Spring Data JPA (Hibernate)
- **Real-time**: WebSocket (STOMP protocol)
- **Container**: Docker & Docker Compose

### Frontend
- **Language**: TypeScript
- **Framework**: React (Vite-based)
- **Canvas Library**: Konva.js (react-konva)
- **State Management**: TanStack Query (React Query) + Zustand
- **Styling**: Tailwind CSS

## Project Structure

```
CanvasEarth/
├── backend/                 # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/canvasearth/
│   │   │   │   ├── config/          # Configuration classes
│   │   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── dto/             # Data Transfer Objects
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   ├── repository/      # Data access layer
│   │   │   │   ├── service/         # Business logic
│   │   │   │   └── CanvasEarthApplication.java
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── build.gradle
│   └── settings.gradle
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── stores/          # State management
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── docker-compose.yml       # PostgreSQL + PostGIS setup
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- Docker & Docker Compose

### 1. Environment Configuration

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration (especially `POSTGRES_PASSWORD`):

```bash
# Required: Set a strong password
POSTGRES_PASSWORD=your-secure-password-here

# Optional: Customize other settings
POSTGRES_DB=canvasearth
POSTGRES_USER=postgres
VITE_API_URL=http://localhost:8080
```

### 2. Start Database

```bash
docker-compose up -d
```

This will start PostgreSQL with PostGIS extension on port 5432.

### 3. Run Backend

```bash
cd backend
./gradlew bootRun
```

Backend will run on http://localhost:8080

API Documentation (Swagger): http://localhost:8080/swagger-ui.html

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:5173

## Development Phases

### Phase 1: Project Setup & Docker ✅
- Spring Boot project setup
- React (Vite) project setup
- PostgreSQL + PostGIS Docker configuration

### Phase 2: Backend Core (CRUD) ✅
- Entity and Repository design
- Service layer with viewport range query logic
- REST API controllers
- Swagger/OpenAPI documentation

### Phase 3: Frontend Canvas Basic ✅ (Current)
- Basic canvas setup with react-konva
- Render data from API on canvas
- Drag and drop for object positioning
- Toolbar with object creation controls
- Text, Image, YouTube object support
- Object deletion with keyboard shortcuts
- React Query integration

### Phase 4: Real-time & Polish (Next)
- WebSocket integration
- UI/UX improvements

## Key Features (Planned)

### Canvas Rendering (Infinite Scroll)
- Zoom in/out with mouse wheel
- Pan map by dragging

### Object CRUD (REST API)
- `POST /api/objects`: Create object
- `GET /api/objects`: Query objects within viewport
- `PUT /api/objects/{id}`: Update position and size
- `DELETE /api/objects/{id}`: Delete object

### Real-time Sync (WebSocket)
- Endpoint: `/ws`
- Subscribe channel: `/topic/canvas`
- Broadcast object changes to all subscribers

## Database Schema

### users
- id: Long (PK, Auto Increment)
- username: String (Unique)
- created_at: LocalDateTime

### canvas_objects
- id: Long (PK, Auto Increment)
- object_type: Enum ('IMAGE', 'TEXT', 'YOUTUBE')
- content_url: Text
- position_x: Double
- position_y: Double
- width: Double
- height: Double
- z_index: Integer
- user_id: Long (FK)
- created_at: LocalDateTime

## Configuration

### Default Ports
- Backend: 8080
- Frontend: 5173
- PostgreSQL: 5432

### Database Configuration

Database credentials are managed through the `.env` file:
- Database: Set via `POSTGRES_DB` (default: canvasearth)
- Username: Set via `POSTGRES_USER` (default: postgres)
- Password: **Required** - Set via `POSTGRES_PASSWORD` in `.env` file

**Security Note**: Never commit `.env` files to version control. Use `.env.example` as a template.

## License

This project is for educational and development purposes.
