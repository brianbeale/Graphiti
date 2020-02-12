import { DataSource } from 'apollo-datasource';

export default class FileAPI extends DataSource {
  constructor(registryRoot) {
    this.registryRoot = registryRoot;
  }

  initialize(config) {
    this.context = config.context;
  }

  async getFile() {
    
  }
}