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

  async sadd(key, member) {
    this.redis.sadd(key, member);
    return member;
  }

  async smembers(key) {
    return this.redis.smembers(key);
  }

  async srem(key, member) {
    return this.redis.srem(key, member);
  }

  async sinter(keys) {
    return this.redis.sinter(keys);
  }

  async scard(key) {
    return this.redis.scard(key);
  }
}
