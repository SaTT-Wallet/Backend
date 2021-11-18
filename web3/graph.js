
module.exports = async function (app) {

    const fetch = require('cross-fetch/polyfill').fetch;
    const createHttpLink = require('apollo-link-http').createHttpLink;

    const { ApolloClient } = require('apollo-client')
    const { InMemoryCache } = require('apollo-cache-inmemory')
    const gql = require('graphql-tag')
    const APIURLBEP20 = app.config.APIURLBEP20;
    const APIURLERC20 = app.config.APIURLERC20;

	var graph = {};

    
    
    const httpLinkBEP20 = createHttpLink({
        uri: APIURLBEP20,
        fetch: fetch
      })


      const httpLinkERC20 = createHttpLink({
        uri: APIURLERC20,
        fetch: fetch
      })  

      const clientBep20 = new ApolloClient({
        link: httpLinkBEP20,
        cache: new InMemoryCache(),
      })

      const clientErc20 = new ApolloClient({
        link: httpLinkERC20,
        cache: new InMemoryCache(),
      })
      
    const queryPromsBep20 = gql`{
        proms(first : 1000) {
          id
          campaign {
            id,
            ratios,
            bounties,
            startDate,
            endDate,
            advertiser,
            token,
            network,
            initialAmount,
            currentAmount,
            isActive
            }
          influencer
          token
          totalAmount
        }
      }      
  `

  const queryPromsErc20 = gql`{
    proms(first : 1000) {
      id
      campaign {
        id,
        ratios,
        bounties,
        startDate,
        endDate,
        advertiser,
        token,
        network,
        amount,
        isActive
        }
      influencer
      token
      amount
    }
  }      
`

  const queryCampaignBep20 = gql`{
    campaigns(first : 1000) {
        id,
        ratios,
        bounties,
        startDate,
        endDate,
        advertiser,
        currentAmount,
        token,
        network,
        isActive
    }
  }      
`

const queryCampaignErc20 = gql`{
  campaigns(first : 1000) {
      id,
      ratios,
      bounties,
      startDate,
      endDate,
      advertiser,
      amount,
      token,
      network,
      isActive
  }
}      
`

  graph.promsBep20 = async ()=> {
    return new Promise(async (resolve, reject) => {
      clientBep20
        .query({
          query:queryPromsBep20
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

graph.campaignsBep20 = async ()=> {
  return new Promise(async (resolve, reject) => {
    clientBep20
      .query({
        query:queryCampaignBep20
      })
      .then((data) => 
        {
          resolve(data.data.campaigns);          
        }
     
      )
      .catch((err) => {
        console.log('Error fetching data: ', err)
      })
  })
}

graph.campaignsErc20 = async ()=> {
  return new Promise(async (resolve, reject) => {
    clientErc20
      .query({
        query:queryCampaignErc20
      })
      .then((data) => 
        {
          resolve(data.data.campaigns);          
        }
      )
      .catch((err) => {
        console.log('Error fetching data: ', err)
      })
  })
}

graph.promsErc20 = async ()=> {
  return new Promise(async (resolve, reject) => {
    clientErc20
      .query({
        query:queryPromsErc20
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

graph.allCampaigns= async ()=>{
  return new Promise(async (resolve, reject) => {
  let campaignBep20 =await app.graph.campaignsBep20();
  let campaignsErc20=await app.graph.campaignsErc20();
  let allCampaigns=campaignBep20.concat(campaignsErc20);
    resolve(allCampaigns)
})

}

graph.allProms= async ()=>{
  return new Promise(async (resolve, reject) => {
  let promsBep20 =await app.graph.promsBep20();
  let promsErc20=await app.graph.promsErc20();
  let allProms=promsBep20.concat(promsErc20);
    resolve(allProms)
})

}



  app.graph = graph;


	return app;
}
