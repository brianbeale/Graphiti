import App from './App.svelte';

import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { ApolloClient } from 'apollo-client';

const cache = new InMemoryCache();

const link = new HttpLink({
  uri: 'http://localhost:4000/graphql', useGETForQueries: true});
const client = new ApolloClient({ cache, link });
// setClient(client);

const app = new App({
  target: document.body,
  props: {
    client: client
  }
});

export default app;