import { GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import GraphQLCustomDatetime from 'graphql-custom-datetype';
import User from './user';

export default new GraphQLObjectType({
  name: 'repo',
  description: 'repo',
  fields: {
    name: {
      type: GraphQLString,
      resolve: repo => repo.name,
    },
    createdAt: {
      type: GraphQLCustomDatetime,
      resolve: () => repo.createdAt,
    },
    tags: {
      type: new GraphQLList(GraphQLString),
      resolve: () => ['foo1', 'foo2'],
    },
    user: {
      type: User,
      resolve: repo => {
        return repo.user;
      },
    },
  }
})
