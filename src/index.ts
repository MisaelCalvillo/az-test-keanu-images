import dotenv from 'dotenv';
import { ApolloServer, gql } from 'apollo-server';
import { MongoClient, Db } from 'mongodb';

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
    console.log('Connecting to MongoDB...', mongoUrl);
    if (!mongoUrl) return process.exit(1);
    const client = new MongoClient(mongoUrl);
    
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