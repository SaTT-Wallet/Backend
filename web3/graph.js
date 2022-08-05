module.exports = async function (app) {
    const fetch = require('cross-fetch/polyfill').fetch
    const createHttpLink = require('apollo-link-http').createHttpLink

    const { ApolloClient } = require('apollo-client')
    const { InMemoryCache } = require('apollo-cache-inmemory')
    const gql = require('graphql-tag')
    const APIURLBEP20 = app.config.APIURLBEP20
    const APIURLERC20 = app.config.APIURLERC20

    var graph = {}

    const httpLinkBEP20 = createHttpLink({
        uri: APIURLBEP20,
        fetch: fetch,
    })

    const httpLinkERC20 = createHttpLink({
        uri: APIURLERC20,
        fetch: fetch,
    })

    const clientBep20 = new ApolloClient({
        link: httpLinkBEP20,
        cache: new InMemoryCache(),
    })

    const clientErc20 = new ApolloClient({
        link: httpLinkERC20,
        cache: new InMemoryCache(),
    })

    const queryCampaignBep20 = gql`
        {
            campaigns(first: 1000) {
                id
                ratios
                bounties
                startDate
                endDate
                advertiser
                currentAmount
                token
                network
                isActive
            }
        }
    `

    graph.promsBep20 = async (nbr) => {
        return new Promise(async (resolve, reject) => {
            let skip = nbr * 1000
            clientBep20
                .query({
                    query: gql`{
            proms(first : 1000,skip:${skip}) {
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
              typeSN
              idPost
              idUser
              isPayed
              isAccepted
            }
          }      
        `,
                })
                .then((data) => {
                    resolve(data.data.proms)
                })
                .catch((err) => {
                    console.log('Error fetching data: ', err)
                })
        })
    }

    graph.campaignsBep20 = async () => {
        return new Promise(async (resolve, reject) => {
            clientBep20
                .query({
                    query: queryCampaignBep20,
                })
                .then((data) => {
                    resolve(data.data.campaigns)
                })
                .catch((err) => {
                    console.log('Error fetching data: ', err)
                })
        })
    }

    graph.campaignsErc20 = async () => {
        return new Promise(async (resolve, reject) => {
            clientErc20
                .query({
                    query: queryCampaignBep20,
                })
                .then((data) => {
                    resolve(data.data.campaigns)
                })
                .catch((err) => {
                    console.log('Error fetching data: ', err)
                })
        })
    }

    graph.promsErc20 = async (nbr) => {
        return new Promise(async (resolve, reject) => {
            let skip = nbr * 1000
            clientErc20
                .query({
                    query: gql`{
          proms(first : 1000,skip:${skip}) {
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
            typeSN
            idPost
            idUser
            isPayed
            isAccepted
          }
        }`,
                })
                .then((data) => {
                    resolve(data.data.proms)
                })
                .catch((err) => {
                    console.log('Error fetching data: ', err)
                })
        })
    }

    graph.promBep20 = async (idProm) => {
        return new Promise(async (resolve, reject) => {
            let request = gql`{
      proms(where:{id:"${idProm}"}) {
        totalAmount
        typeSN
        idPost
        idUser
        campaign{
          id
          initialAmount
          currentAmount
          token
        }
       
      }
  }      
`
            clientBep20
                .query({
                    query: request,
                })
                .then((data) => {
                    resolve(data.data.proms)
                })
                .catch((err) => {
                    console.log('Error fetching data: ', err)
                })
        })
    }

    graph.promErc20 = async (idProm) => {
        return new Promise(async (resolve, reject) => {
            let request = gql`{
      proms(where:{id:"${idProm}"}) {
        totalAmount
        typeSN
        idPost
        idUser
        campaign{
          id
          initialAmount
          currentAmount
          token
        }
       
      }
  }      
`
            clientErc20
                .query({
                    query: request,
                })
                .then((data) => {
                    resolve(data.data.proms)
                })
                .catch((err) => {
                    console.log('Error fetching data: ', err)
                })
        })
    }

    graph.getPromDetails = async (idProm) => {
        return new Promise(async (resolve, reject) => {
            let promBep20 = await app.graph.promBep20(idProm)
            let promErc20 = await app.graph.promErc20(idProm)
            let prom = promBep20.concat(promErc20)
            resolve(prom[0])
        })
    }

    graph.allCampaigns = async () => {
        return new Promise(async (resolve, reject) => {
            let campaignBep20 = await app.graph.campaignsBep20()
            let campaignsErc20 = await app.graph.campaignsErc20()
            let allCampaigns = campaignBep20.concat(campaignsErc20)
            resolve(allCampaigns)
        })
    }

    graph.allProms = async (nbr) => {
        return new Promise(async (resolve, reject) => {
            let promsBep20 = await app.graph.promsBep20(nbr)
            let promsErc20 = await app.graph.promsErc20(nbr)
            let allProms = promsBep20.concat(promsErc20)
            resolve(allProms)
        })
    }

    app.graph = graph

    return app
}
