// Storefronts
// https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer_services][]=storefront&page_size=100&page=1
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/cloud-9-collective-1/menu_items?page=1&page_size=20

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

const PAGE_SIZE = 100;
const HOW_POLITE_DELAY = 500;

const sleep = util.promisify(setTimeout);
const fancyRequest = new PoliteRequest(HOW_POLITE_DELAY).request;

console.log(`Hello ${process.env.LOGNAME}`);

const getStorefrontProductsMeta = async slug => {
  const waitForIt = await fancyRequest(
    `https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/${slug}/menu_items`
  );
  return waitForIt.meta;
};

// https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer_services][]=storefront&page_size=100&page=1

// const getAllStorefronts = async (slug, total_listings) =>
//   await Promise.all(
//     getPaginationOffsets(await getStorefrontsTotalNumber(), PAGE_SIZE).map(
//       async offset => await getStorefrontsPage(offset)
//     )
//   );
// const getAllStorefrontsFromDB = async (connection) => {
//   return ;
// }

(async () => {
  const connection = await MongoClient.connect();
  const allStorefronts = await connection
    .db("puppet-scrape")
    .collection("weedmaps.com/storefronts")
    .find({})
    .toArray();
  for (let storefront of allStorefronts) {
    const meta = await getStorefrontProductsMeta(storefront.slug);
    await sleep(1000);
    console.log(getPaginationOffsets(meta.total_menu_items, PAGE_SIZE));

    // if (dbStuff.length < 1) {
    //   const nugget = await fancyRequest(
    //     `https://api-g.weedmaps.com/discovery/v1/brands/${id}`
    //   );
    //   // console.log( nugget )
    //   const { slug } = nugget.data.brand;
    //   const total_products_count = await getBrandProducts(slug);
    //   const products = await getAllProducts(slug, total_products_count);
    //   await connection
    //     .db("puppet-scrape")
    //     .collection("weedmaps.com/brands")
    //     .updateOne(
    //       { slug: nugget.data.brand.slug },
    //       {
    //         $set: Object.assign(
    //           { total_products_count, products },
    //           nugget.data.brand
    //         )
    //       },
    //       { upsert: true }
    //     );
    //   console.log(
    //     chalk.green(
    //       `Scraped: ${chalk.yellow(
    //         nugget.data.brand.slug
    //       )} with ${chalk.yellow(total_products_count)} products`
    //     )
    //   );
    //   await sleep(HOW_POLITE_DELAY);
    // }
  }
  await connection.close();
  return console.log(chalk.bgBlue.white("🌿 All Done! 🌿"));
})();
