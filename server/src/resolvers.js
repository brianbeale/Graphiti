const resolvers = {
  Query: {
    file: async (_parent, { filePath }) => {
      return { filePath };
    },
    folder: async (_parent, { folderPath }, { dataSources }) => {
      const folder = await dataSources.FileAPI.getFolder(folderPath);
      return folder;
    },
    tag: async (_parent, { tagName }) => {
      return { tagName };
    },
    filesTagged: async (_parent, { tagNames }, { dataSources }) => {
      const filePaths = await dataSources.RedisAPI.sinter(tagNames);
      return filePaths.map( filePath => { return {filePath}; });
    }
  },
  Mutation: {
    tagFile: async (_parent, { filePath, tagName }, { dataSources }) => {
      dataSources.RedisAPI.sadd(filePath, tagName);
      dataSources.RedisAPI.sadd(tagName, filePath);
      const tagNames = await dataSources.RedisAPI.smembers(filePath);
      return { filePath, tagNames };
    },
    untagFile: async (_parent, { filePath, tagName }, { dataSources }) => {
      dataSources.RedisAPI.srem(filePath, tagName);
      dataSources.RedisAPI.srem(tagName, filePath);
      const tagNames = await dataSources.RedisAPI.smembers(filePath);
      return { filePath, tagNames };
    }
  },
  Folder: {
    files: async (folder) => {
      const files = folder.filePaths.map((filePath)=>({ filePath }));
      return files;
    },
    folders: async (folder, _args, { dataSources }) => {
      const promisedFolders = [];
      for (const folderPath of folder.folderPaths) {
        let promisedFolder = dataSources.FileAPI.getFolder(folderPath);
        promisedFolders.push(promisedFolder);
      }
      const folders = await Promise.all(promisedFolders);
      return folders;
    }
  },
  File: {
    contents: async (file, _args, { dataSources }) => {
      return await dataSources.FileAPI.getFileContents(file.filePath);
    },
    tags: async (file, _args, {dataSources}) => {
      const tagNames = await dataSources.RedisAPI.smembers(file.filePath);

      const tags = Array.from(tagNames,tagName => {return { tagName: tagName };} );
      console.log(tags);
      return tags;
    }
  },
  Tag: {
    files: async (tag, _args, { dataSources }) => {
      return await dataSources.RedisAPI.smembers(tag.tagName);
    }
  }
};

export default resolvers;