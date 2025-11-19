# FitnessHub Admin Panel

A comprehensive admin panel for managing a women's fitness website built with React and Express.

## Features

- **User Management**: View, edit, and manage user accounts with role-based access
- **Content Management**: Create and manage workout programs, articles, and nutrition plans
- **Class Management**: Schedule and manage fitness classes with instructor assignment
- **E-commerce**: Manage products, orders, and membership plans
- **Analytics Dashboard**: Track user engagement, revenue, and popular content

## Tech Stack

- **Frontend**: React 18, React Router, Recharts, Axios
- **Backend**: Express.js, better-sqlite3
- **Authentication**: JWT-based auth with role-based access control

## Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run init-db  # Initialize database with schema and seed data
npm start        # Start server on port 5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm start        # Start React app on port 3000
```

## Default Login Credentials

| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Admin   | admin@fitnesshub.com     | admin123   |
| Trainer | trainer@fitnesshub.com   | trainer123 |
| Member  | member@fitnesshub.com    | member123  |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/charts` - Get chart data

### Users
- `GET /api/users` - List users (with search/filter)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Membership Plans
- `GET /api/plans` - List plans
- `POST /api/plans` - Create plan
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

### Workout Programs
- `GET /api/programs` - List programs
- `GET /api/programs/:id` - Get program with exercises
- `POST /api/programs` - Create program
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program

### Fitness Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Schedule
- `GET /api/schedule` - Get schedule (with date range)
- `POST /api/schedule` - Create schedule
- `PUT /api/schedule/:id` - Update schedule
- `DELETE /api/schedule/:id` - Delete schedule

### Articles
- `GET /api/articles` - List articles
- `GET /api/articles/:id` - Get article
- `POST /api/articles` - Create article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Nutrition Plans
- `GET /api/nutrition` - List nutrition plans
- `GET /api/nutrition/:id` - Get plan with meals
- `POST /api/nutrition` - Create plan
- `PUT /api/nutrition/:id` - Update plan
- `DELETE /api/nutrition/:id` - Delete plan

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### File Upload
- `POST /api/upload` - Upload file

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts with roles and membership info
- `membership_plans` - Subscription plans
- `workout_programs` - Fitness programs
- `exercises` - Exercise library
- `fitness_classes` - Class types
- `class_schedule` - Scheduled classes
- `articles` - Blog posts/articles
- `nutrition_plans` - Meal plans
- `products` - Merchandise
- `orders` - Customer orders
- `subscriptions` - User subscriptions

## Role-Based Access

- **Admin**: Full access to all features
- **Trainer**: Can manage content, view users, manage schedules
- **Member**: View-only access (for member-facing app)

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Role-based middleware
- Input validation
- CORS enabled

## License

MIT
