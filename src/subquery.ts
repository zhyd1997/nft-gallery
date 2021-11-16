import ApolloClient from 'apollo-boost'
import { InMemoryCache } from 'apollo-cache-inmemory'

const apolloClient = new ApolloClient({
  // You should use an absolute URL here
  name: 'subquery',
  cache: new InMemoryCache(),
  uri: process.env.VUE_APP_SUBQUERY_URL || 'https://api.subquery.network/sq/vikiival/magick'
  // uri: 'https://api.subquery.network/sq/vikiival/magick'
})

export default apolloClient
