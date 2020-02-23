import Koa from 'koa';
import { ApolloServer } from 'apollo-server-koa';

import typeDefs from './schema';
import resolvers from './resolvers';

import RedisAPI from './datasources/RedisAPI';
const Redis = require('ioredis');
const store = new Redis();

import FileAPI from './datasources/FileAPI';

const server = new ApolloServer({ 
  typeDefs, 
  resolvers, 
  cors: false,
  dataSources: () => {
    return {
      RedisAPI: new RedisAPI(store),
      FileAPI: new FileAPI('home/Brian/Pictures/')
    };
  }, 
  context: () => {
    return {
      token: 'foo',
    };
  },
});

const app = new Koa();

const cors = require('@koa/cors');
app.use(cors());
server.applyMiddleware({ app, cors: false });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);