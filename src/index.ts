import dotenv from 'dotenv';
import { ApolloServer, gql } from 'apollo-server';
import { MongoClient, Db } from 'mongodb';
import axios from 'axios';

// Load environment variables
dotenv.config();

// MongoDB connection URL
const mongoUrl = process.env.MONGO_URI;

if (!mongoUrl) {
  console.error('MONGO_URI is not defined in the environment variables');
  process.exit(1);
}

// MongoDB connection function
async function connectToDatabase(): Promise<Db> {
  console.log('Connecting to MongoDB...');
  
  // Remove any surrounding quotes from the connection string
  const cleanMongoUrl = mongoUrl?.replace(/^["'](.+(?=["']$))["']$/, '$1');
  if (!cleanMongoUrl) return process.exit(1);
  
  const client = new MongoClient(cleanMongoUrl);
  
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    return client.db();
  } catch (error) {
    console.error('Could not connect to MongoDB', error);
    process.exit(1);
  }
}

// Define your GraphQL schema
const typeDefs = gql`
  type Query {
    getKeanuImage(width: Int!, height: Int!, young: Boolean!, grayscale: Boolean!): String!
    fetchKeanuImage(width: Int!, height: Int!, young: Boolean!, grayscale: Boolean!): String!
  }
`;

// Define your resolvers
const resolvers = {
  Query: {
    getKeanuImage: (_: any, args: { width: number; height: number; young: boolean; grayscale: boolean }) => {
      const { width, height, young, grayscale } = args;
      const youngParam = young ? 'y' : 'g';
      const grayscaleParam = grayscale ? 'g' : 'c';
      return `https://placekeanu.com/${width}/${height}/${youngParam}/${grayscaleParam}`;
    },
    fetchKeanuImage: async (_: any, args: { width: number; height: number; young: boolean; grayscale: boolean }) => {
      const { width, height, young, grayscale } = args;
      const youngParam = young ? 'y' : 'g';
      const grayscaleParam = grayscale ? 'g' : 'c';
      const url = `https://placekeanu.com/${width}/${height}/${youngParam}/${grayscaleParam}`;
      
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        return buffer.toString('base64');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error:', error.message);
          throw new Error(`Failed to fetch image: ${error.message}`);
        } else {
          console.error('Unexpected error:', error);
          throw new Error('Failed to fetch image');
        }
      }
    },
  },
};

// Start the server
async function startServer() {
  const db = await connectToDatabase();
  
  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: { db } // Pass the database connection to the context
  });

  const PORT = process.env.PORT || 4000;
  server.listen(PORT).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
}

startServer().catch(error => console.error(error));