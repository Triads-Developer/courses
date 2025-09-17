# Courses Application

A full-stack web application for searching and browsing course information with advanced filtering capabilities and detailed course section analysis.

## Project Structure

This project consists of two main components:

- **`courses-server/`** - Node.js/Express backend API server
- **`courses-ui/`** - React frontend application

## Architecture Overview

### Backend (courses-server)
- **Framework**: Express.js with Node.js
- **Data Processing**: CSV parsing and real-time file watching
- **Search**: Fuzzy search using Fuse.js
- **Deployment**: PM2 process management with SSL support
- **Environments**: Development, Staging, Production

### Frontend (courses-ui)
- **Framework**: React 18 with Material-UI components
- **Build Tool**: Create React App with CRACO configuration
- **State Management**: React hooks and local state
- **UI Components**: Material-UI DataGrid, modals, and custom components
- **Deployment**: Static file deployment to web servers

## Backend Structure (courses-server)

### Core Files
- **`index.js`** - Main server entry point with Express setup, SSL configuration, and route mounting
- **`search.js`** - Fuzzy search implementation using Fuse.js
- **`ecosystem.config.js`** - PM2 process management configuration

### Directory Structure
```
courses-server/
├── config/
│   └── ssl.js              # SSL certificate configuration
├── data/
│   └── data.csv            # Main course data file
├── data backup/            # Backup data files
├── deployment/             # Deployment scripts
│   ├── dev_deploy.sh       # Development deployment
│   ├── stage_deploy.sh     # Staging deployment
│   ├── prod_deploy.sh      # Production deployment
│   └── *_update_data.sh    # Data update scripts
├── routes/
│   ├── courses.js          # Course search and section endpoints
│   └── metadata.js         # Metadata and filter options
└── utils/
    ├── data_loader.js      # CSV data loading and parsing
    ├── data_watcher.js     # File system watching for data updates
    └── validators.js       # Input validation utilities
```

### API Endpoints
- **`GET /api/courses/search`** - Search courses with filters
- **`GET /api/courses/section/:sectionNumber`** - Get detailed section information
- **`GET /api/metadata/filters`** - Get available filter options
- **`GET /api/metadata/stats`** - Get course statistics

## Frontend Structure (courses-ui)

### Core Files
- **`src/App.js`** - Main application component
- **`src/Controls.js`** - Main search interface and filter controls
- **`src/ResultsGrid.js`** - Data grid for displaying search results
- **`src/CourseModal.js`** - Detailed course information modal
- **`src/Constants.js`** - Application constants and configuration

### Directory Structure
```
courses-ui/
├── public/                 # Static assets
├── src/
│   ├── App.js             # Main app component
│   ├── App.css            # Global styles
│   ├── Controls.js        # Search controls and filters
│   ├── ResultsGrid.js     # Results display grid
│   ├── CourseModal.js     # Course detail modal
│   ├── CourseModal.css    # Modal styles
│   ├── Dropdown.js        # Custom dropdown component
│   ├── Tutorial.js        # User tutorial component
│   └── Constants.js       # App constants
├── build/                 # Production build output
└── deployment scripts     # Environment-specific deployment
```

### Key Features
- **Advanced Search**: Fuzzy search with multiple filter criteria
- **Data Grid**: Sortable, filterable course results with Material-UI DataGrid
- **Course Details**: Modal with detailed section information and cross-listings
- **Responsive Design**: Mobile-friendly interface
- **Tutorial System**: Built-in user guidance

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PM2 (for production deployment)

### Backend Setup
```bash
cd courses-server
npm install
npm run dev          # Development with nodemon
npm start           # Production start
```

### Frontend Setup
```bash
cd courses-ui
npm install
npm start           # Development server (port 3001)
npm run build       # Production build
```

## Build Process

### Backend Build
The backend is a Node.js application that doesn't require a traditional build process:
```bash
# Development
npm run dev

# Production
npm start
```

### Frontend Build
The frontend uses Create React App with CRACO for customization:

```bash
# Development build
npm run build:dev

# Staging build
npm run build:stage

# Production build
npm run build:prod
```

Build outputs are generated in the `build/` directory and include:
- Optimized JavaScript bundles
- CSS files with vendor prefixes
- Static assets
- Service worker for caching

## Deployment

### Environment Configuration
The application supports three environments:
- **Development** (`dev`) - Testing environment
- **Staging** (`stage`) - Pre-production testing
- **Production** (`prod`) - Live application

### Backend Deployment
Deployment scripts handle file transfer and PM2 process management:

```bash
# Deploy to development
npm run deploy-dev

# Deploy to staging
npm run deploy-stage

# Deploy to production
npm run deploy-prod

# Update data only
npm run update-data-dev
npm run update-data-stage
npm run update-data-prod
```

### Frontend Deployment
Frontend deployment uploads built static files:

```bash
# Deploy to development
npm run deploy-dev

# Deploy to staging
npm run deploy-stage

# Deploy to production
npm run deploy-prod
```

### Deployment Process
1. **Build**: Create optimized production build
2. **Upload**: Transfer files to target server via SFTP
3. **Restart**: Restart PM2 processes (backend) or reload web server (frontend)
4. **Verify**: Check application health and functionality

## Data Management

### Data Sources
- **Primary Data**: `courses-server/data/data.csv` - Main course information
- **Backup Data**: `courses-server/data backup/` - Historical and backup files

### Data Updates
- **Real-time Watching**: File system watcher automatically reloads data when CSV files change
- **Manual Updates**: Use deployment scripts to update data files
- **Data Validation**: Input validation ensures data integrity

### Data Format
The CSV data includes fields such as:
- Course identification (Course Number, Section Number)
- Academic information (Academic Period, Program of Study)
- Scheduling (Days, Start Time, End Time)
- Requirements (Academic Requirement, IQ Attributes)
- Credits and department information

## Configuration

### Environment Variables
- **Backend**: `PORT`, `NODE_ENV`
- **Frontend**: `REACT_APP_ENV` (dev/stage/prod)

### SSL Configuration
SSL certificates are configured in `courses-server/config/ssl.js` for HTTPS support in production environments.

### PM2 Configuration
Process management is configured in `ecosystem.config.js` with:
- Memory limits
- Auto-restart settings
- Environment variables
- Instance management

## Development Guidelines

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Standard Node.js conventions
- **Formatting**: Automated with Prettier

### Testing
- **Frontend**: Jest + React Testing Library
- **Backend**: Manual testing with provided test scripts

### Performance
- **Frontend**: Code splitting, lazy loading, bundle analysis
- **Backend**: Efficient CSV parsing, memory management with PM2

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version and dependency compatibility
2. **Deployment Issues**: Verify SFTP credentials and server access
3. **Data Loading**: Ensure CSV file format and permissions
4. **SSL Issues**: Check certificate validity and configuration

### Debugging
- **Backend**: Use `console.log` and PM2 logs
- **Frontend**: Browser developer tools and React DevTools
- **Network**: Check API endpoints and CORS configuration
