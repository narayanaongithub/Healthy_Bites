# Healthy Foods Platform

A comprehensive solution for office goers to effortlessly buy healthy meal options for breakfast, lunch, and dinner, with both one-time orders and monthly subscription services.

## Project Overview

The Healthy Foods Platform is built using a microservices architecture, with the following components:

1. **Frontend**: HTML5, CSS3, JavaScript, and Bootstrap for responsive design
2. **Backend**: Multiple Python Flask microservices with MySQL database
3. **Authentication**: JWT (JSON Web Token) based authentication
4. **API Gateway**: Central access point for all services

## Microservices

1. **API Gateway**: Routes requests to appropriate microservices
2. **Auth Service**: Handles user authentication and authorization
3. **User Service**: Manages user profiles and personal information
4. **Product Service**: Manages food products, categories, and meal types
5. **Order Service**: Handles individual meal orders and processing
6. **Subscription Service**: Manages monthly meal subscription plans

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository

   ```
   git clone <repository-url>
   cd healthy-foods-platform
   ```

2. Start the application

   ```
   docker-compose up -d
   ```

3. Access the application
   - Frontend: http://localhost
   - API Gateway: http://localhost:5000
   - PHPMyAdmin: http://localhost:8080 (username: root, password: password)

## API Documentation

### Auth Service

- **POST /api/auth/register**: Register a new user
- **POST /api/auth/login**: Login and get authentication token
- **GET /api/auth/user**: Get current user information

### User Service

- **GET /api/users**: Get all users (admin only)
- **GET /api/users/{id}**: Get user by ID
- **PUT /api/users/{id}**: Update user profile

### Product Service

- **GET /api/products**: Get all products with optional filters
- **GET /api/products/{id}**: Get product by ID
- **GET /api/products/meal/{meal_type}**: Get products by meal type (breakfast, lunch, dinner)
- **GET /api/categories**: Get all categories
- **GET /api/categories/{id}**: Get category by ID
- **POST /api/admin/products**: Add new product (admin only)
- **PUT /api/admin/products/{id}**: Update product (admin only)

### Order Service

- **POST /api/orders**: Create a new order
- **GET /api/orders**: Get user's orders
- **GET /api/orders/{id}**: Get order by ID
- **PUT /api/orders/{id}**: Update order status
- **DELETE /api/orders/{id}**: Cancel an order

### Subscription Service

- **GET /api/subscription-plans**: Get all subscription plans
- **GET /api/subscription-plans/{id}**: Get subscription plan by ID
- **POST /api/subscriptions**: Create a new subscription
- **GET /api/subscriptions**: Get user's subscriptions
- **GET /api/subscriptions/active**: Get user's active subscription
- **PUT /api/subscriptions/{id}**: Update subscription
- **POST /api/subscriptions/{id}/cancel**: Cancel a subscription

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: Python, Flask
- **Database**: MySQL
- **Authentication**: JWT
- **Containerization**: Docker
- **API Documentation**: Swagger/OpenAPI

## Development

Each microservice is contained in its own directory with:

- Dockerfile for containerization
- Requirements file for dependencies
- Source code in the src directory

The API Gateway routes all requests to the appropriate service and handles communication between services.
