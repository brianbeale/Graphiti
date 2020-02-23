const resolvers = {
  Query: {
    file: async (_parent, { filePath }) => {
      return { filePath };
    },
    folder: async (_parent, { folderPath }, context) => {
      const folder = await context.dataSources.FileAPI.getFolder(folderPath);
      return folder;
    }
  },
  Folder: {
    files: async (folder) => {
      const files = folder.filePaths.map((filePath)=>({ filePath }));
      return files;
    },
    folders: async (folder, _args, context) => {
      const promisedFolders = [];
      for (const folderPath of folder.folderPaths) {
        let promisedFolder = context.dataSources.FileAPI.getFolder(folderPath);
        promisedFolders.push(promisedFolder);
      }
      const folders = await Promise.all(promisedFolders);
      return folders;
    }
  },
  File: {
    contents: async (file, _args, context) => {
      return await context.dataSources.FileAPI.getFileContents(file.filePath);
    },
  }
};

export default resolvers;