# Advanced Node.js API with TypeScript, Fastify, and Prisma

This project is a monorepo containing a Node.js API built with TypeScript, Fastify, and Prisma. It includes advanced features such as authentication, file uploads, and real-time notifications.

## Project Structure

The project is organized as a monorepo with the following main packages:

- `api`: The main API package
- `shared-utils`: Shared utilities used across packages
- `services`: Additional services (if any)

## Features

- User authentication with JWT
- File uploads
- Real-time notifications
- CRUD operations for users and posts
- Input validation
- Error handling
- API documentation with Swagger

## Prerequisites

- Node.js (version X.X.X)
- Yarn or npm
- PostgreSQL database

## Installation

1. Clone the repository:
git clone <repository-url>

2. Install dependencies:
yarn install

3. Set up environment variables:
Copy `.env.example` to `.env` in the `packages/api` directory and fill in the required values.

4. Set up the database:
cd packages/api
npx prisma migrate dev

## Running the Application

To start the API server:
cd packages/api
yarn start

The API will be available at `http://localhost:<PORT>`.

## Testing

To run the tests:
cd packages/api
yarn test

## API Documentation

API documentation is available using Swagger. After starting the server, visit `http://localhost:<PORT>/documentation` to view the API docs.

## Project Structure
.
├── packages
│   ├── api
│   │   ├── config
│   │   ├── middleware
│   │   ├── prisma
│   │   ├── routes
│   │   ├── schemas
│   │   ├── services
│   │   ├── tests
│   │   ├── types
│   │   └── utils
│   ├── shared-utils
│   └── services
└── README.md

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).