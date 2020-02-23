import { DataSource } from 'apollo-datasource';
import { readFile, readdir } from 'fs';

export default class FileAPI extends DataSource {
  constructor(registryRoot) {
    super();
    this.registryRoot = registryRoot;
  }

  initialize(config) {
    this.context = config.context;
  }

  async getFileContents(filePath) {
    const contents = await new Promise((resolve, reject) => {
      readFile(filePath, (err, data) => {
        if (err) { reject(err); }
        resolve(data);
      });
    });
    // TODO: move base64 encoding to readFile? (new Buffer() deprecated)
    return new Buffer(contents).toString('base64');
  }

  async getFolder(folderPath) {
    // TODO: refactor to fsPromises...
    const folder = await new Promise((resolve, reject) => {
      readdir(folderPath, { withFileTypes: true }, (err, files) => {
        if (err) { reject(err); }
        const filePaths = [];
        const folderPaths = [];
        // Each f in files is a Dirent per { withFileTypes: true }
        try {
          files.filter(f=>f.name[0]!=='.').forEach((f)=>{
            // console.log('f'); console.log(f);
            if (f.isFile() ) { filePaths.push(`${folderPath}/${f.name}`); }
            else { folderPaths.push(`${folderPath}/${f.name}`); }
          });
        } catch (error) {
          console.log(error);
        }
        resolve({ folderPath, filePaths, folderPaths });
      });
    });
    return folder;
  }
}