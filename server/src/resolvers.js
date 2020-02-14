const resolvers = {
  Query: {
    file: async (parent, { filePath }, context, info) => {
      const file = await context.dataSources.FileAPI.getFile(filePath);
      return file;
    },
    folder: async (parent, { folderPath }, context, info) => {
      const folder = await context.dataSources.FileAPI.getFolder(folderPath);
      return folder;
    }
  },
  Folder: {
    files: async (folder, args, context) => {
      const promisedFiles = [];
      for (const filePath of folder.filePaths) {
        let promisedFile = context.dataSources.FileAPI.getFile(filePath);
        promisedFiles.push(promisedFile);
      };
      const files = await Promise.all(promisedFiles);
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
  }
};

export default resolvers;