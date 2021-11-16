import ApolloClient from 'apollo-boost'
// import { HttpLink } from 'apollo-link-http'
// import { split } from 'apollo-link'
// import { WebSocketLink } from 'apollo-link-ws'
// import { getMainDefinition } from 'apollo-utilities'



// const httpLink = new HttpLink({
//   uri: 'https://gql.rmrk.app/v1/graphql',
// })

// Create the subscription websocket link
// const wsLink = new WebSocketLink({
//   uri: 'wss://gql.rmrk.app/v1/graphql',
//   options: {
//     reconnect: true,
//   },
// })

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
  uri: 'https://gql.rmrk.app/v1/graphql'
})

export default apolloClient
