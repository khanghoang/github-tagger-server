import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import Repo from './repo';
import RepoMongoose from '../models/repo';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'root',
    description: '',
    fields: () => ({
      repos: {
        type: new GraphQLList(Repo),
        args: {
          limit: {
            type: GraphQLInt,
          },
          token: {
            type: GraphQLString,
          },
        },
        resolve: (root, args, context) => {
          return new Promise((resolve, reject) => {
            RepoMongoose.find()
              .limit(args.limit)
              .populate('user')
              .then(repos => {
                resolve(repos);
              });
          });
        },
      },
    }),
  }),
});

export default schema;
