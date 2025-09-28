# 🎬 Movies Platform Backend API

A robust and scalable backend API for a movie streaming platform built with Node.js, Express, TypeScript, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Sprint 1 - Authentication & User Management
- ✅ **User Registration & Authentication**
  - Secure user registration with email validation
  - JWT-based authentication system
  - Password hashing with bcrypt (12 salt rounds)
  - Email verification and password recovery

- ✅ **User Profile Management**
  - Complete CRUD operations for user profiles
  - Secure password change functionality
  - Account deletion with confirmation
  - Avatar upload support

- ✅ **Security Features**
  - Helmet.js for security headers
  - CORS configuration for cross-origin requests
  - Rate limiting to prevent abuse
  - Input validation and sanitization
  - SQL injection and XSS protection

### Upcoming Features (Future Sprints)
- 🔄 **Movie Management** (Sprint 1)
  - Movie catalog with search and filters
  - Video streaming integration (Cloudinary/Pexels)
  - Subtitle support (Spanish/English)

- 🔄 **User Interactions** (Sprint 2)
  - Favorites system
  - Movie ratings (1-5 stars)

- 🔄 **Social Features** (Sprint 3)
  - Comments and reviews
  - User activity tracking

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcryptjs, CORS
- **Email Service**: Nodemailer (Gmail)
- **File Storage**: Cloudinary (planned)
- **Documentation**: JSDoc
- **Deployment**: Render

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **MongoDB Atlas** account (or local MongoDB instance)
- **Gmail** account with App Password for email service
- **Cloudinary** account for file storage (planned)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-team/movies-platform.git
   cd movies-platform/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see [Configuration](#configuration))

5. **Build the project**
   ```bash
   npm run build
   ```

## ⚙️ Configuration

Create a `.env` file in the backend root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/movies-platform?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# Email Service (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Cloudinary Configuration (for future sprints)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 🔐 Security Notes

- **JWT_SECRET**: Must be at least 32 characters long
- **EMAIL_PASSWORD**: Use Gmail App Password, not your regular password
- **MONGODB_URI**: Include your actual MongoDB Atlas credentials
- Never commit the `.env` file to version control

## 🏃‍♂️ Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate JSDoc documentation
npm run docs

# Watch and regenerate docs
npm run docs:watch

# Linting (placeholder)
npm run lint

# Testing (placeholder)
npm test
```

### 🔄 Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Server will start on** `http://localhost:5000`

3. **API documentation available at** `http://localhost:5000/docs`

4. **Health check endpoint** `http://localhost:5000/health`

### 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   └── environment.ts # Environment variables
│   ├── controllers/     # Request handlers
│   │   └── authController.ts # Authentication logic
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   ├── errorHandler.ts # Error handling
│   │   └── validation.ts # Input validation
│   ├── models/          # MongoDB models
│   │   └── User.ts      # User schema
│   ├── routes/          # API routes
│   │   └── authRoutes.ts # Authentication endpoints
│   ├── services/        # Business logic
│   │   └── emailService.ts # Email operations
│   ├── types/           # TypeScript interfaces
│   │   └── index.ts     # Type definitions
│   └── index.ts         # Application entry point
├── docs/                # Generated documentation
├── tests/               # Test files (future)
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── jsdoc.conf.json      # JSDoc configuration
├── render.yaml          # Render deployment config
└── README.md           # This file
```

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://movies-platform-api.onrender.com`

### Authentication Endpoints

All authentication endpoints are prefixed with `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | User login | ❌ |
| POST | `/logout` | User logout | ✅ |
| GET | `/profile` | Get user profile | ✅ |
| PUT | `/profile` | Update user profile | ✅ |
| DELETE | `/account` | Delete user account | ✅ |
| POST | `/forgot-password` | Request password reset | ❌ |
| POST | `/reset-password` | Reset password with token | ❌ |
| POST | `/change-password` | Change password | ✅ |
| POST | `/verify-token` | Verify JWT token | ✅ |

### Example Requests

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "age": 25
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

#### Get Profile (with JWT token)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer your-jwt-token-here"
```

### Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "error": null,
  "errors": null
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": ["Field-specific error messages"]
}
```

## 🚀 Deployment

### Render Deployment

This project is configured for automatic deployment on Render.

1. **Connect GitHub repository** to Render
2. **Create a new Web Service** with these settings:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

3. **Set environment variables** in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secure-jwt-secret
   EMAIL_USER=your-gmail-address
   EMAIL_PASSWORD=your-gmail-app-password
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

4. **Deploy** - Render will automatically deploy on every push to main branch

### Health Check

The API includes a health check endpoint at `/health` that returns:

```json
{
  "success": true,
  "message": "Movies Platform API is running successfully",
  "data": {
    "environment": "production",
    "timestamp": "2025-09-28T10:00:00.000Z",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

## 🧪 Testing

Testing framework will be implemented in future iterations. Planned testing includes:

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Authentication Tests**: JWT and security testing
- **Database Tests**: MongoDB operations testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📖 Code Documentation

This project uses JSDoc for comprehensive code documentation.

### Generate Documentation

```bash
# Generate static documentation
npm run docs

# Watch for changes and regenerate
npm run docs:watch
```

Documentation will be available at `http://localhost:5000/docs`

### Documentation Standards

- All functions, classes, and interfaces are documented with JSDoc
- Parameters and return types are explicitly defined
- Examples are provided for complex functions
- TypeScript interfaces are fully documented

## 🔒 Security Features

- **Helmet.js**: Sets various HTTP headers for security
- **CORS**: Configured for specific frontend origins
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive validation using custom middleware
- **Password Security**: bcrypt with 12 salt rounds
- **JWT Security**: Secure token generation and validation
- **Error Handling**: Prevents information leakage in production

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Coding Standards

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc documentation for all functions
- Include error handling for all operations
- Write meaningful commit messages
- Add tests for new features (when testing is implemented)

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Movies Platform Team** - Initial work and ongoing development

## 🙏 Acknowledgments

- Express.js community for excellent documentation
- MongoDB for robust database solutions
- TypeScript team for type safety
- All open-source contributors who made this project possible

---

**Movies Platform Backend API** - Built with ❤️ for movie enthusiasts everywhere! 🎬🍿