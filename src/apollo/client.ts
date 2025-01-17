import { ApolloClient, InMemoryCache } from '@apollo/client';

export const healthClient = new ApolloClient({
    uri: 'https://api.thegraph.com/index-node/graphql',
    cache: new InMemoryCache(),
});

console.log("xploited react block subgrab", process.env.REACT_APP_BLOCKS_SUBGRAPH_URL)
export const blockClient = new ApolloClient({
    uri: process.env.REACT_APP_BLOCKS_SUBGRAPH_URL,
    cache: new InMemoryCache(),
    queryDeduplication: true,
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'no-cache',
        },
        query: {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all',
        },
    },
});

export const client = new ApolloClient({
    uri: process.env.REACT_APP_SUBGRAPH_URL,
    cache: new InMemoryCache({
        typePolicies: {
            Token: {
                // Singleton types that have no identifying field can use an empty
                // array for their keyFields.
                keyFields: false,
            },
            Pool: {
                // Singleton types that have no identifying field can use an empty
                // array for their keyFields.
                keyFields: false,
            },
        },
    }),
    queryDeduplication: true,
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'no-cache',
        },
        query: {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all',
        },
    },
});
