import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import { ApolloClient } from "apollo-client";

// Should change to Hermes later?
const cache = new InMemoryCache();

// Link must use /graphql endpoint!
const link = new HttpLink({
  uri: "http://localhost:4000/graphql",
  useGETForQueries: true
});

const client = new ApolloClient({
  cache,
  link
});

import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from "@apollo/react-hooks";

import Controller from './components/Controller';
const app = (
  <ApolloProvider client={client}>
    <Controller />
  </ApolloProvider>
);

const mountNode = document.getElementById('root');
ReactDOM.render(app, mountNode);