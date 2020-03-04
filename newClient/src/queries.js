import gql from 'graphql-tag';

/* ************ folderPath Queries ************ */
export const GET_CHILD_FILES = gql`
  query filePathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      files {
        filePath
  }}}`;
export const GET_CHILD_FOLDERS = gql`
  query folderPathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      folders {
        folderPath
  }}}`;
/* ************ filePath Queries ************ */
export const GET_FILE = gql`
  query file($filePath: String) {
    file(filePath: $filePath) {
      contents
  }}`;
export const GET_TAGS = gql`
 query tagsAssignedToFile($filePath: String) {
   file(filePath: $filePath) {
     tags {
       tagName
  }}}`;
/* ************ tagName Queries ************ */
export const SEARCH_TAGS = gql`
  query filesTagged($tagNames: [String]) {
    filesTagged(tagNames: $tagNames) {
      filePath
    }}`;
/* ************ Mutations ************ */
export const ASSIGN_TAG = gql`
  mutation tagFile($filePath: String, $tagName: String) {
    tagFile(filePath: $filePath, tagName: $tagName) {
      filePath,
      tagNames
  }}`;
export const UNASSIGN_TAG = gql`
 mutation untagFile($filePath: String, $tagName: String) {
   untagFile(filePath: $filePath, tagName: $tagName) {
     filePath,
     tagNames
  }}`;