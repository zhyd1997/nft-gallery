
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { WebSocketLink } from 'apollo-link-ws'


// const httpLink = new HttpLink({
//   uri: 'https://gql.rmrk.app/v1/graphql',
// })

// Create the subscription websocket link
const link = new WebSocketLink({
  uri: 'wss://gql.rmrk.app/v1/graphql',
  options: {
    reconnect: true,
  },
})

// const link = split(
//   // split based on operation type
//   ({ query }) => {
//     const definition = getMainDefinition(query)
//     return definition.kind === 'OperationDefinition' &&
//       definition.operation === 'subscription'
//   },
//   wsLink,
//   httpLink
// )

const apolloClient = new ApolloClient({
  name: 'rmrk',
  link,
  cache: new InMemoryCache()
})

export default apolloClient
