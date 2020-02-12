import TestAPI from './datasources/RedisAPI';

const resolvers = {
  Query: {
    folder: async (parent, args, context, info) => {
      const folder = await context.dataSources.FileAPI.getFolder(args.filePath);
      return folder;
    },
  },
  Mutation: {
    assignTag: async (parent, args, context, info) => {
      const tag = await context.dataSources.RedisAPI.setKey('name', args.name);
      return tag;
    }
  }
};

export default resolvers;