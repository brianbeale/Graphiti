import { DataSource } from 'apollo-datasource';

export default class RedisAPI extends DataSource {
  constructor(store) {
    super();
    this.redis = store;
  }

  initialize(config) {
    this.context = config.context;
  }

  async setKey(key, value) {
    this.redis.set(key, value);
    return value;
  }

  async getKey(key) {
    return this.redis.get(key);
  }
}
