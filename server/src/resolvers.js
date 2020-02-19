const resolvers = {
  Query: {
    file: async (parent, { filePath }, context, info) => {
      return { filePath };
    },
    folder: async (parent, { folderPath }, context, info) => {
      const folder = await context.dataSources.FileAPI.getFolder(folderPath);
      return folder;
    }
  },
  Folder: {
    files: async (folder, args, context) => {
      const files = folder.filePaths.map((filePath)=>({ filePath }));
      return files;
    },
    folders: async (folder, args, context) => {
      const promisedFolders = [];
      for (const folderPath of folder.folderPaths) {
        let promisedFolder = context.dataSources.FileAPI.getFolder(folderPath);
        promisedFolders.push(promisedFolder);
      };
      const folders = await Promise.all(promisedFolders);
      return folders;
    }
  },
  File: {
    contents: async (file, args, context) => {
      return await context.dataSources.FileAPI.getFileContents(file.filePath);
    },
  }
};

export default resolvers;