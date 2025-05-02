const { Client } = require('pg');
require('dotenv').config();
const algoliasearch = require('algoliasearch');


const marketplaceConfig = {
    user : process.env.MARKETPLACE_DB_USER_NAME,
    password : process.env.MARKETPLACE_DB_USER_PASSWORD,
    host : process.env.MARKETPLACE_DB_HOST,
    database : process.env.MARKETPLACE_DB_NAME,
    port: process.env.MARKETPLACE_DB_PORT
};

async function fetchPrice(symbol, currencies) {
  // Construct the full URL dynamically using query parameters
  const url = `${process.env.PRICES_URL}?symbol=${symbol}&currencies=${currencies}`;

  try {
      // Call the API and fetch data
      const response = await fetch(url);
      if (!response.ok) {
         // throw new Error(`Error fetching data: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.message === "success" && data.data[currencies]) {
          // Return the price in USD
          return data.data[currencies]; 
      } else {
          console.log("API response did not return success or no USD data:", data);
          return null;
      }
  } catch (error) {
      console.error("Error:", error);
      return null;
  }
}



module.exports.pushdata = async (event, context) => {
    console.log(JSON.stringify(event))
    const client = new Client(marketplaceConfig);
    await client.connect()
    console.log("connected to db");
    try {
    
    ids = [  ];
    for(const record of event.Records){
      const jsonString = record.body;
      const unescapedJsonString = jsonString.replace(/\\/g, ''); 
      const parsedObject = JSON.parse(unescapedJsonString);
      for(id of parsedObject.ids){
        ids.push(id)
      }
    }   
    
    for(const id of ids){
      var query = "SELECT * FROM assets WHERE is_deleted = false AND status IN ('LISTED', 'MINTED','CLAIM') and id = $1";
      const objects = await client.query(query, [id]);

      // var query = "SELECT * FROM assets WHERE is_deleted = false AND status IN ('LISTED', 'MINTED','CLAIM')";
      // const objects = await client.query(query);
    
      var records = [];
     
      for(let row of objects.rows){
        var tagName = null;
        var catrgoryName =null;
        var networkName = null;
        var networkId = null;
        var protocolName=  null;
        var meta_media_url = null;
        var description = null;
        var title =null;
        var symbol = null;
        var name = null;
        var Card_Type = null;
        var price = null;
        var apr = null;
        var contractName = null;
        var contractAddress = null;
        var listingPrice = null;
        var convertedPrice = 0;
        var listingSymbol = null;
        var transactionTime = null;
        var networkLogo = null;
        var protocolLogo = null;
        var tags = [];
        var tags_id =[];
        var tags_names =[]

        var xp = null;
        
        if(row.id !=null){
          var asset_application_q = `SELECT * FROM public.assets_applications WHERE asset_id = '${row.id}' and application_name = 'TOKEN_HUB' `;
          const asset_applicationData = await client.query(asset_application_q) 
          if(asset_applicationData.rowCount > 0){
            continue;
          } 
        }
        
        if(row.category_id !=null){
          var categoryQuery = `SELECT * FROM public.categories WHERE id = '${row.category_id}' and is_deleted = false `;
          const categoryData = await client.query(categoryQuery) 
          if(categoryData.rowCount > 0){
            catrgoryName = categoryData.rows[0].name
          } 
        }

        if(row.id !=null){
          var assets_meta_query = `SELECT * FROM public.assets_meta WHERE asset_id = '${row.id}' and is_deleted = false `;
          const assets_metaData = await client.query(assets_meta_query) 
          if(assets_metaData.rowCount > 0){
            const listingInfoJson = assets_metaData.rows[0].listing_info;
            if(listingInfoJson != null){
              listingPrice = listingInfoJson.price / Math.pow(10, listingInfoJson.payment_token_decimals);;
              listingSymbol = listingInfoJson.payment_token_symbol;
              transactionTime = listingInfoJson.listing_update_timestamp;
            }
            xp = assets_metaData.rows[0].trade_xp;
          } 
        }
        if(row.network_chain_id !=null){
          var networkQuery = `SELECT * FROM public.chains WHERE chain_id = '${row.network_chain_id}' `;
          const networkData = await client.query(networkQuery)  
          if(networkData.rowCount > 0){
            networkName = networkData.rows[0].display_name
            networkLogo = networkData.rows[0].icon_url
            networkId = networkData.rows[0].chain_id
          }
        }

        if(row.protocol_id !=null){
          var protocolQuery = `SELECT * FROM public.protocols WHERE id = '${row.protocol_id}' and is_deleted = false `;
          const protocolData = await client.query(protocolQuery)  
          if(protocolData.rowCount > 0){
            protocolName = protocolData.rows[0].name
            protocolLogo = protocolData.rows[0].logo_url
          }
        }
        
        if (row.meta_data !== null && Object.keys(row.meta_data).length !== 0) {
          for(let data of row.meta_data){
            if(data.name == 'media' || data.name == 'Media'){
              meta_media_url = data.value.gateway
              if(!meta_media_url){
                meta_media_url = data.value.pngUrl
              }
              if(!meta_media_url){
                meta_media_url = data.value.cachedUrl
              }
              if(!meta_media_url){
                meta_media_url = data.value.originalUrl
              }
              if(!meta_media_url){
                meta_media_url = data.value.thumbnailUrl
              }
            }
            else if(data.name == 'description' || data.name == 'Description'){
              description = data.value
            }
            else if(data.name == 'title' || data.name == 'Title'){
              title = data.value
            }
            else if(data.name == 'symbol' || data.name == 'Symbol'){
              symbol = data.value
            }
            else if(data.name == 'name' || data.name == 'Name'){
              name = data.value
            }
            else if(data.name == 'card type' || data.name == 'Card Type' || data.name == 'Card type'){
              Card_Type = data.value
            }
            else if(data.name == 'price' || data.name == 'Price'){
              price = data.value
            }
            else if(data.name == 'apr' || data.name == 'Apr'){
              apr = data.value
            }

          }
        }
               
        if(row.id != null){
          var tagQuery = `SELECT * FROM public.assets_tags where "assetsId"  ='${row.id}'  `;
          const tagData = await client.query(tagQuery)  
          if(tagData.rowCount > 0){
            for(let data of tagData.rows){  
              var tagIDQuery = `SELECT * FROM public.tags where id  ='${data.tagsId}'  `;
              const tagIDData = await client.query(tagIDQuery)  
              if(tagIDData.rowCount > 0){
                tags.push(tagIDData.rows[0].name);  
                tags_id.push(data.tagsId);
                tags_names.push(tagIDData.rows[0].name);
              }
            }
          }
        }
        if(row.primary_tag_id !=null){
          var TagQuery = `SELECT * FROM public.tags WHERE id = '${row.primary_tag_id}' and is_deleted = false `;
          const tagData = await client.query(TagQuery)  
          if(tagData.rowCount > 0){
            tags.push(tagData.rows[0].name);  
            tagName = tagData.rows[0].name;
          }
        }

        if(row.type == 'AT_FRACTIONALIZED'){
          if(row.dlt_smart_contract_id != null){
            var contractQuery = `SELECT * FROM public.smart_contracts WHERE id = '${row.dlt_smart_contract_id}'  `;
            const contractData = await client.query(contractQuery)  
            if(contractData.rowCount > 0){
              contractName = contractData.rows[0].standard
            }
          }
        }
        else{

          if(row.origin_smart_contract_id != null){
            var contractQuery = `SELECT * FROM public.smart_contracts WHERE id = '${row.origin_smart_contract_id}'  `;
            const contractData = await client.query(contractQuery)  
            if(contractData.rowCount > 0){
              contractName = contractData.rows[0].standard
              contractAddress= contractData.rows[0].address
            }
          }

          if(row.dlt_id != null){
            if( row.dlt_id != '0' && row.type== 'AT_NFT'){
              contractName = "ERC6960";
            }
          }
        }
        
        
        if(row.exchange == null || row.type == 'AT'){
          continue;
        }
        if(listingSymbol !=null && listingSymbol!=''){
          await fetchPrice(listingSymbol, 'USD')
            .then(convertedprice => {
                if (convertedprice !== null) {
                  if(listingPrice>0){
                    convertedPrice = convertedprice * listingPrice
                  }
                  else if (row.min_buy_valuation > 0)
                  {
                    convertedPrice = convertedprice * row.min_buy_valuation
                  }
                } 
            });
        }
        if(row.payment_token !=null && row.payment_token!=''){
          await fetchPrice(row.payment_token, 'USD')
            .then(convertedprice => {
                if (convertedprice !== null) {
                  if(listingPrice>0){
                    convertedPrice = convertedprice * listingPrice
                    if (convertedPrice==0 && row.min_buy_valuation > 0)
                    {
                      convertedPrice = convertedprice * row.min_buy_valuation
                    }
                  }
                   
                } 
            });
        }
        let record = {
          'objectID': row.id,
          'data': {
              'is_deleted': row.is_deleted,
              'created_at': row.created_at,
              'updated_at': row.updated_at,
              'deleted_at': row.deleted_at,
              'id': row.id,
              'owner': row.owner,
              'token_id': row.token_id,
              'dlt_id': row.dlt_id,
              'type': row.type,
              'status': row.status,
              'platform_fee': row.platform_fee,
              'custodian': row.custodian,
              'rank': row.rank,
              'valuation': row.valuation,
              'mint_info': row.mint_info,
              'buy_now': row.buy_now.toString(),
              'min_buy_valuation' : row.min_buy_valuation,
              'tags' : tags,
              'tags_id' : tags_id,
              'category_name' : catrgoryName,
              'network_id' : networkId,
              'network_name' : networkName ,
              'network_logo' : networkLogo ,
              'protocol_name' : protocolName ,
              'protocol_logo': protocolLogo,
              'contract_name' : contractName,
              'contract_address' : contractAddress,
              'exchange': row.exchange,
              'primary_tag': tagName,
              'listingPrice' :listingPrice,
              'convertedPrice':convertedPrice,
              'listingSymbol' : listingSymbol ,
              'transactionTime' : transactionTime,
              'payment_token': row.payment_token,
              'search_slug' : row.search_slug,
              'meta_data' : {
                'media' : meta_media_url ,
                'description': description,
                'title' : title,
                'symbol' :symbol,
                'name' : name,
                'Card_Type' :Card_Type,
                'price' : price,
                'xp': xp,
                'apr' : apr,
                'contract_address' : contractAddress
              }
              
            }
        };
        records.push(record); 
      }

     
      const alogiaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_API_KEY);
      const index = alogiaClient.initIndex(process.env.ALGOLIA_INDEX);
      
      if(records.length > 0){
        await index.saveObjects(records)
        .then(({ objectIDs }) => {
          console.log("Saved " + objectIDs);
        })
        .catch(error => {
          console.error(error);
        });
      }
      
      if(records.length == 0){
        await index.deleteObject(id)
        .then(() => {
          console.log('Objects deleted successfully' + id);
        })
        .catch(error => {
          console.error('Error deleting objects:', error);
        });
      }

     
      
   }
        
     
    } catch (error) {
      console.error('Error executing queries:', error);
      throw error;
    } finally {
      await client.end();
    }
};