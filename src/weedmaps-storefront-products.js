// Storefronts
// https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer_services][]=storefront&page_size=100&page=1
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/cloud-9-collective-1/menu_items?page=1&page_size=20

const PAGE_SIZE = 100;
const HOW_POLITE_DELAY = 500;

const util = require("util");
const chalk = require("chalk");
const getPaginationOffsets = require("./functions/getPaginationOffsets");

const PoliteRequest = require("./functions/PoliteRequest");
const MongoClient = new require("mongodb").MongoClient(
  "mongodb://localhost:27017",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const sleep = util.promisify(setTimeout);
const fancyRequest = new PoliteRequest(HOW_POLITE_DELAY);

console.log(`Hello ${process.env.LOGNAME}`);

const getStorefrontProductsMeta = async slug => {
  const waitForIt = await fancyRequest.get(
    `https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/${slug}/menu_items`
  );
  return waitForIt.meta;
};

// https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer_services][]=storefront&page_size=100&page=1

const getAllStorefrontProductsPages = async (slug, total) =>
  await Promise.all(
    getPaginationOffsets(total, PAGE_SIZE).map(
      async offset => await getStorefrontsProductPage(slug, offset)
    )
  );

const getAllStorefrontProducts = async (slug, total) => {
  const thePages = await getAllStorefrontProductsPages(slug, total);
  let flatProducts = [];
  for (let pageOfProducts in thePages) {
    Object.keys(pageOfProducts).map(arrayIndex => {
      Object.keys(thePages[pageOfProducts[arrayIndex]]).map(index => {
        flatProducts.push(thePages[pageOfProducts[arrayIndex]][index]);
      });
    });
  }
  return flatProducts;
};

const getStorefrontsProductPage = async (slug, current_offset) => {
  const waitForIt = await fancyRequest.get(
    `https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/` +
      `${slug}/menu_items?offset=${current_offset}&page_size=${PAGE_SIZE}`
  );
  return waitForIt.data.menu_items;
  // .map(item => {
  //   console.log(typeof item);
  //   return item;
  // });
};
const shuffle = array => {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};

(async () => {
  const connection = await MongoClient.connect();
  const allStorefronts = shuffle(
    await connection
      .db("puppet-scrape")
      .collection("weedmaps.com/storefronts")
      .find({})
      .toArray()
  );
  for (let storefront of allStorefronts) {
    await sleep(fancyRequest.getDelayAmount());
    const { slug, meta, lastUpdate } = storefront;
    let productsMeta;
    try {
      productsMeta = await getStorefrontProductsMeta(slug);
    } catch (err) {
      console.error(chalk.red(`🔥 Caught Error`), err);
      continue;
    }
    const { total_menu_items, updated_at } = productsMeta;
    if (lastUpdate !== null && lastUpdate !== undefined) {
      const oneDayAgo = Date.now() - 60 * 60 * 24;
      // console.log(Date.parse(lastUpdate), oneDayAgo);
      if (Date.parse(lastUpdate) > oneDayAgo) {
        if (meta !== null && meta !== undefined) {
          // Scraped Before, Check for updates
          // console.log(meta, "meta");
          // console.log(
          //   Date.parse(meta.updated_at),
          //   Date.parse(updated_at),
          //   Date.parse(meta.updated_at) === Date.parse(updated_at)
          // );
          if (Date.parse(meta.updated_at) === Date.parse(updated_at)) {
            // No update, bail on the for loop
            console.log(
              chalk.green(
                `⚛️ ${chalk.yellow(slug)} Checked, products up to date`
              )
            );
            continue;
          }
        }
      } else {
        console.log(chalk.green(`✅ ${chalk.yellow(slug)} Complete!`));
        continue;
      }
    }
    const products = await getAllStorefrontProducts(slug, total_menu_items);
    await connection
      .db("puppet-scrape")
      .collection("weedmaps.com/storefronts")
      .updateOne(
        { slug },
        {
          $set: Object.assign(
            { meta, products, lastUpdate: new Date() },
            storefront
          )
        },
        { upsert: true }
      );
    console.log(
      chalk.green(
        `💾 ${chalk.yellow(slug)} Updated with ${chalk.yellow(
          products.length
        )} products`
      )
    );
  }
  await connection.close();
  return console.log(chalk.bgBlue.white("🌿 All Done! 🌿"));
})();
