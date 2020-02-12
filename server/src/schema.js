import { gql } from 'apollo-server-koa';

const typeDefs = gql`
  type Query {
    folder(filePath: String!): Folder
  }

  type Folder {
    filePath: String!
    parentDir: Folder
    folders: [Folder]
    files: [File]
  }

  type File {
    filePath: String!
    parentDir: Folder!
    contents: String!
    tags: [Tag]
  }

  type Tag {
    name: String!
    files: [File]
  }

  type Mutation {
    assignTag(tag: String, filePath: String): String
  }
`;

export default typeDefs;