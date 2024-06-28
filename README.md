# Keanu Reeves Image Retrieval App

This application allows users to retrieve images of Keanu Reeves based on specified dimensions and styles. It consists of a Node.js backend with Apollo Server and MongoDB integration.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- Node.js (v14 or later)
- npm (usually comes with Node.js)
- Docker (optional, for containerized deployment)
- MongoDB Atlas account (for database)

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/keanu-image-app.git
   cd keanu-image-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy the `.env.example` file to `.env`
   - Fill in the required values in the `.env` file, including your MongoDB Atlas connection string

## Running the Application Locally

1. Build the TypeScript code:
   ```
   npm run build
   ```

2. Start the server:
   ```
   npm start
   ```

3. For development with auto-restart on file changes:
   ```
   npm run dev
   ```

The server will start on `http://localhost:4000` (or the port specified in your `.env` file).

## Running with Docker

1. Build the Docker image:
   ```
   docker build -t keanu-image-app .
   ```

2. Run the Docker container:
   ```
   docker run -p 4000:4000 --env-file .env keanu-image-app
   ```

The server will be accessible at `http://localhost:4000`.

## API Usage

Once the server is running, you can access the GraphQL playground at `http://localhost:4000/graphql`. Here's an example query:

```graphql
query {
  getKeanuImage(width: 300, height: 200, young: false, grayscale: true)
}
```

## Development

- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.