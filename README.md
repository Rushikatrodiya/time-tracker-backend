# Time Tracker Backend API

A robust, production-ready REST API for time tracking and project management built with Node.js, Express.js, and MySQL.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (USER, MANAGER, ADMIN)
  - Secure HTTP-only cookie handling
  - Redis session management

- **Project Management**
  - Create and manage projects
  - Project status tracking (ACTIVE, ARCHIVED)
  - Owner-based project access control

- **Task Management**
  - Create, read, update, and delete tasks
  - Task status tracking (TODO, IN_PROGRESS, DONE)
  - Priority-based task organization
  - User task assignment

- **Time Tracking**
  - Start/stop time tracking
  - Automatic duration calculation
  - Task-based time logging

- **API Documentation**
  - Comprehensive Swagger/OpenAPI 3.0 documentation
  - Interactive API explorer at `/api-docs`

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI 3.0
- **Development**: Nodemon, TypeScript

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Redis (v6.0 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd time-tracker-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/time_tracker"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRE="15m"
JWT_REFRESH_EXPIRE="7d"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npx prisma db seed
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Interactive Documentation

Visit `http://localhost:3000/api-docs` for interactive Swagger UI documentation with complete API specifications including:

- **Authentication**: Register, login, logout, token refresh
- **Users**: Get current user profile
- **Projects**: Create and manage projects (MANAGER/ADMIN)
- **Tasks**: Full CRUD operations with filtering, pagination, and role-based permissions
- **Time Logs**: Start/stop timer functionality with automatic duration calculation

### Authentication Endpoints

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| POST   | `/auth/register` | Register a new user  |
| POST   | `/auth/login`    | User login           |
| POST   | `/auth/signout`  | User logout          |
| POST   | `/auth/refresh`  | Refresh access token |

### User Endpoints

| Method | Endpoint    | Description              |
| ------ | ----------- | ------------------------ |
| GET    | `/users/me` | Get current user profile |

### Project Endpoints (MANAGER/ADMIN only)

| Method | Endpoint    | Description                  |
| ------ | ----------- | ---------------------------- |
| POST   | `/projects` | Create new project           |
| GET    | `/projects` | Get all projects (paginated) |

### Task Endpoints

| Method | Endpoint     | Description                                 |
| ------ | ------------ | ------------------------------------------- |
| POST   | `/tasks`     | Create new task (MANAGER/ADMIN)             |
| GET    | `/tasks`     | Get all tasks with filtering and pagination |
| GET    | `/tasks/:id` | Get task by ID                              |
| PUT    | `/tasks/:id` | Update task                                 |
| DELETE | `/tasks/:id` | Delete task (MANAGER/ADMIN)                 |

### Time Log Endpoints

| Method | Endpoint          | Description                                      |
| ------ | ----------------- | ------------------------------------------------ |
| GET    | `/timelogs`       | Get all timelogs (Admins see all, users see own) |
| POST   | `/timelogs/start` | Start timer for a specific task                  |
| POST   | `/timelogs/end`   | End the currently running timer                  |

## 🏗 Project Structure

```
time-tracker-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── db.js        # Database configuration
│   │   ├── redis.js     # Redis configuration
│   │   └── swagger.js   # Swagger configuration
│   ├── docs/            # API documentation (Swagger)
│   │   ├── auth.yaml
│   │   ├── project.yaml
│   │   ├── tasks.yaml
│   │   └── timelogs.yaml
│   ├── middlewares/     # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── role.middleware.js
│   ├── modules/         # Feature modules
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── timelogs/
│   │   └── users/
│   ├── validatation/    # Input validation schemas
│   │   ├── project.validations.js
│   │   ├── task.validations.js
│   │   └── timelog.validations.js
│   ├── app.js          # Express app configuration
│   └── server.js       # Server entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── .env               # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Authentication & Authorization

### Authentication Flow

1. User registers/logs in via `/auth/register` or `/auth/login`
2. Server returns access token (JWT) and sets refresh token in HTTP-only cookie
3. Access token is sent in `Authorization: Bearer <token>` header for protected routes
4. Refresh token automatically refreshes access tokens via `/auth/refresh`

### Role-Based Access Control

- **USER**: Can view assigned tasks and create time logs
- **MANAGER**: Can create projects, manage tasks, and view team time logs
- **ADMIN**: Full system access

### Protected Routes

All routes except authentication endpoints require a valid JWT token. Some routes require specific roles:

- `/projects/*` - MANAGER or ADMIN
- `/tasks` (POST, DELETE) - MANAGER or ADMIN
- `/timelogs` - All authenticated users

## 🗄 Database Schema

### Core Entities

- **User**: User accounts with roles and relationships
- **Project**: Project management with owner relationships
- **Task**: Task management with project and user assignments
- **TimeLog**: Time tracking with user and task relationships

### Relationships

- Users can own multiple projects
- Projects can have multiple tasks
- Tasks can be assigned to users
- Users can create multiple time logs for tasks

## 🔧 Development

### Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests (placeholder)
```

### Database Operations

```bash
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev      # Create and apply migrations
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema to database
```

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://user:pass@host:3306/db"
REDIS_URL="redis://host:6379"
JWT_SECRET="production-secret"
JWT_REFRESH_SECRET="production-refresh-secret"
```

### Production Build

```bash
npm install --production
npx prisma generate
npx prisma migrate deploy
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check DATABASE_URL in `.env`
   - Ensure database exists

2. **Redis Connection Error**
   - Verify Redis is running
   - Check REDIS_URL in `.env`
   - Ensure Redis is accessible

3. **Authentication Issues**
   - Verify JWT secrets are set
   - Check token expiration times
   - Ensure cookies are enabled in client

### Health Check

```bash
# Check if server is running
curl http://localhost:3000

# Check API documentation
curl http://localhost:3000/api-docs
```

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.
