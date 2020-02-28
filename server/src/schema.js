import { gql } from 'apollo-server-koa';

const typeDefs = gql`
  type Query {
    file(filePath: String): File
    folder(folderPath: String): Folder
    tag(tagName: String): Tag
    filesTagged(tagNames: [String]): [File]
  }

  type Mutation {
    tagFile(filePath: String, tagName: String): TagFileResponse!
    untagFile(filePath: String, tagName: String): TagFileResponse!
  }

  type TagFileResponse {
    filePath: String
    tagNames: [String]
  }

  type File {
    filePath: String!
    contents: String!
    tags: [Tag]
  }

  type Folder {
    folderPath: String!
    files: [File]
    folders: [Folder]
  }

  type Tag {
    tagName: String!
    files: [File]
  }
`;

export default typeDefs;