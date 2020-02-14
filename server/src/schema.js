import { gql } from 'apollo-server-koa';

const typeDefs = gql`
  type Query {
    file(filePath: String): File
    folder(folderPath: String): Folder
  }

  type File {
    filePath: String!
    contents: String!
  }

  type Folder {
    folderPath: String!
    files: [File]
    folders: [Folder]
  }

`;

export default typeDefs;