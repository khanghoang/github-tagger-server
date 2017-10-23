import express from 'express';
import schema from './schema';
import graphqlHTTP from 'express-graphql';

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: () => {
    return 'hello world';
  },
  graphiql: true,
}));

export default app;
