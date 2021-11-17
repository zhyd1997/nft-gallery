import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

const link = createHttpLink({
  // You should use an absolute URL here
  uri: process.env.VUE_APP_SUBQUERY_URL || 'https://api.subquery.network/sq/vikiival/magick'
  // uri: 'https://api.subquery.network/sq/vikiival/magick'
})

const cache = new InMemoryCache()

const apolloClient = new ApolloClient({
  // You should use an absolute URL here
  name: 'subquery',
  cache,
  link
})

export default apolloClient
