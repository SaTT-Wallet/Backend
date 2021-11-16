
module.exports = async function (app) {

    const fetch = require('cross-fetch/polyfill').fetch;
    const createHttpLink = require('apollo-link-http').createHttpLink;

    const { ApolloClient } = require('apollo-client')
    const { InMemoryCache } = require('apollo-cache-inmemory')
    const gql = require('graphql-tag')


	var graph = {};
    const APIURL = 'https://api.thegraph.com/subgraphs/name/geoffreymoya/satt-campaigns-bsc'
    const httpLink = createHttpLink({
        uri: APIURL,
        fetch: fetch
      })

      const client = new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
      })
      
    const query = gql`{
        proms(first : 1000) {
          id
          influencer
          token
          totalAmount
        }
      }      
  `





  graph.client = async ()=> {
    return new Promise(async (resolve, reject) => {
        client
        .query({
          query
        })
        .then((data) => 
          {
            resolve(data.data.proms);          
          }
       
        )
        .catch((err) => {
          console.log('Error fetching data: ', err)
        })
    })
}

  app.graph = graph;


	return app;
}
