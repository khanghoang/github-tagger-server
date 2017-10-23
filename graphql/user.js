import { GraphQLObjectType, GraphQLString } from 'graphql';

export default new GraphQLObjectType({
  name: 'user',
  description: 'user',
  fields: {
    githubID: {
      type: GraphQLString,
      resolve: user => user.githubID,
    },
    profile: {
      type: new GraphQLObjectType({
        name: 'profile',
        fields: {
          name: {
            type: GraphQLString,
            resolve: profile => profile.name,
          },
          picture: {
            type: GraphQLString,
            resolve: profile => profile.picture,
          },
          email: {
            type: GraphQLString,
            resolve: profile => profile.email,
          },
        },
      }),
      resolve: user => {
        return user.profile;
      },
    },
  },
});
