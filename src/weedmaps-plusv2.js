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
const fancyRequest = new PoliteRequest(HOW_POLITE_DELAY).get;

console.log(`Hello ${process.env.LOGNAME}`);

const getStorefrontsPage = async current_offset => {
  const waitForIt = await fancyRequest(
      `https://api-g.weedmaps.com/discovery/v2/listings?`+
      `filter[plural_types][]=dispensaries&filter[plus_only]=true`+
      `&offset=${current_offset}&page_size=${PAGE_SIZE}`
  );
  return waitForIt.data.listings;
};


const getStorefrontsTotalNumber = async () => {
  const waitForIt = await fancyRequest(
    // `https://api-g.weedmaps.com/discovery/v1/listings` +
    //   `?filter[any_retailer_services][]=storefront`
    `https://api-g.weedmaps.com/discovery/v2/listings?` +
    `filter[plural_types][]=dispensaries&filter[plus_only]=true`
  );
  return waitForIt.meta.total_listings;
};

const getAllStorefronts = async (slug, total_listings) =>
  await Promise.all(
    getPaginationOffsets(await getStorefrontsTotalNumber(), PAGE_SIZE).map(
      async offset => await getStorefrontsPage(offset)
    )
  );

(async () => {
  const connection = await MongoClient.connect();
  for (let page of await getAllStorefronts()) {
    for (let storefront of page) {
      // console.log(storefront.length);
      const { id, name, slug } = storefront;
      const dbStuff = await connection
        .db("puppet-scrape")
        .collection("weedmaps.com/plus-listings")
        .find({ id })
        .toArray();
      if (dbStuff[0] !== undefined) {
        console.log(chalk.yellow(`${chalk.red(dbStuff[0].name)} found in DB`));
      } else {
        await connection
          .db("puppet-scrape")
          .collection("weedmaps.com/plus-listings")
          .updateOne(
            { slug },
            {
              $set: storefront
            },
            { upsert: true }
          );
        console.log(chalk.green(`Scraped: ${chalk.yellow(slug)}`));
      }
    }
  }
  await connection.close();
  return console.log(chalk.bgBlue.white("🌿🌿🌿 All Done! 🌿🌿🌿"));
})();
