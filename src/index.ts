import dotenv from 'dotenv';
import { ApolloServer, gql } from 'apollo-server-express';
import { MongoClient, Db } from 'mongodb';
import axios from 'axios';
import express from 'express';

dotenv.config();

const mongoUrl = process.env.MONGO_URI;

if (!mongoUrl) {
  console.error('MONGO_URI is not defined in the environment variables');
  process.exit(1);
}

let dbClient: MongoClient;

async function connectToDatabase(): Promise<Db> {
  console.log('Connecting to MongoDB...');
  
  const cleanMongoUrl = mongoUrl?.replace(/^["'](.+(?=["']$))["']$/, '$1');
  if (!cleanMongoUrl) return process.exit(1);

  dbClient = new MongoClient(cleanMongoUrl);
  
  try {
    await dbClient.connect();
    console.log('Connected successfully to MongoDB');
    return dbClient.db();
  } catch (error) {
    console.error('Could not connect to MongoDB', error);
    process.exit(1);
  }
}

async function testMongoConnection(): Promise<boolean> {
  if (!dbClient) {
    return false;
  }
  try {
    await dbClient.db().command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return false;
  }
}

const typeDefs = gql`
  type Transaction {
    _id: ID!
    width: Int!
    height: Int!
    young: Boolean!
    grayscale: Boolean!
    timestamp: String!
    imageUrl: String!
  }

  type Query {
    getKeanuImage(width: Int!, height: Int!, young: Boolean!, grayscale: Boolean!): String!
    fetchKeanuImage(width: Int!, height: Int!, young: Boolean!, grayscale: Boolean!): String!
    getPastTransactions: [Transaction!]!
  }
`;

const resolvers = {
  Query: {
    getKeanuImage: (_: any, args: { width: number; height: number; young: boolean; grayscale: boolean }) => {
      const { width, height, young, grayscale } = args;
      const youngParam = young ? 'y' : 'g';
      const grayscaleParam = grayscale ? 'g' : 'c';
      return `https://placekeanu.com/${width}/${height}/${youngParam}/${grayscaleParam}`;
    },
    fetchKeanuImage: async (_: any, args: { width: number; height: number; young: boolean; grayscale: boolean }, context: { db: Db }) => {
      const { width, height, young, grayscale } = args;
      const youngParam = young ? 'y' : 'g';
      const grayscaleParam = grayscale ? 'g' : 'c';
      const url = `https://placekeanu.com/${width}/${height}/${youngParam}/${grayscaleParam}`;
      
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const base64Image = buffer.toString('base64');

        // Store transaction in MongoDB
        await context.db.collection('transactions').insertOne({
          width,
          height,
          young,
          grayscale,
          timestamp: new Date().toISOString(),
          imageUrl: url
        });

        return base64Image;
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
    getPastTransactions: async (_: any, __: any, context: { db: Db }) => {
      try {
        const transactions = await context.db.collection('transactions')
          .find()
          .sort({ timestamp: -1 })
          .limit(100)  // Limit to last 100 transactions
          .toArray();
        return transactions;
      } catch (error) {
        console.error('Failed to retrieve past transactions:', error);
        throw new Error('Failed to retrieve past transactions');
      }
    },
  },
};

async function startServer() {
  const db = await connectToDatabase();

  const app = express();
  
  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: { db }
  });

  await server.start();
  server.applyMiddleware({ app });

  app.get('/healthcheck', async (req, res) => {
    const isMongoConnected = await testMongoConnection();
    if (isMongoConnected) {
      res.status(200).json({ status: 'OK', message: 'Server is running and connected to MongoDB' });
    } else {
      res.status(500).json({ status: 'Error', message: 'Server is running but not connected to MongoDB' });
    }
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Health check available at http://localhost:${PORT}/healthcheck`);
  });
}

startServer().catch(error => console.error(error));