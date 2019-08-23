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

process.on("unhandledrejection", event => {
  // Prevent error output on the console:
  event.preventDefault();
  console.log("Reason: " + event.reason);
});

const getOffsetPage = async (current_offset, endpoint) => {
  const where = endpoint === undefined ? "brands" : endpoint;
  const url = `https://api-g.weedmaps.com/discovery/v1/${where}?offset=${current_offset}&page_size=${PAGE_SIZE}`;
  return await fancyRequest(url);
};

const getBrandTotalNumber = async () => {
  const waitForIt = await fancyRequest(
    `https://api-g.weedmaps.com/discovery/v1/brands`
  );
  return waitForIt.meta.total_brands;
};

const getBrandProducts = async brandSlug => {
  const waitForIt = await fancyRequest(
    `https://api-g.weedmaps.com/discovery/v1/brands/${brandSlug}/products`
  );
  return waitForIt.meta.total_products_count;
};

const getAllWeedmapsBrands = async () =>
  await Promise.all(
    getPaginationOffsets(await getBrandTotalNumber(), PAGE_SIZE).map(
      async offset => {
        const waitForIt = await getOffsetPage(offset, "brands");
        return waitForIt.data.brands.map(brand => {
          return {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            position: brand.position,
            is_premium: brand.is_premium,
            rating: brand.rating,
            reviews_count: brand.reviews_count,
            favorites_count: brand.favorites_count
          };
        });
      }
    )
  );

const getAllProducts = async (slug, total_listings) =>
  await Promise.all(
    getPaginationOffsets(total_listings, PAGE_SIZE).map(async offset => {
      let waitForIt;
      try {
        waitForIt = await getOffsetPage(offset, `brands/${slug}/products`);
        return waitForIt.data.products;
      } catch (err) {
        console.error(err);
      }
    })
  );

(async () => {
  const connection = await MongoClient.connect();
  for (let page of await getAllWeedmapsBrands()) {
    for (let brand of page) {
      const { id, name } = brand;
      const dbStuff = await connection
        .db("puppet-scrape")
        .collection("weedmaps.com/brands")
        .find({ id })
        .toArray();
      if (dbStuff[0] !== undefined) {
        console.log(chalk.yellow(`${chalk.red(dbStuff[0].name)} found in DB`));
      }
      if (dbStuff.length < 1) {
        const nugget = await fancyRequest(
          `https://api-g.weedmaps.com/discovery/v1/brands/${id}`
        );
        // console.log( nugget )
        const { slug } = nugget.data.brand;
        const total_products_count = await getBrandProducts(slug);
        const products = await getAllProducts(slug, total_products_count);
        await connection
          .db("puppet-scrape")
          .collection("weedmaps.com/brands")
          .updateOne(
            { slug: nugget.data.brand.slug },
            {
              $set: Object.assign(
                { total_products_count, products },
                nugget.data.brand
              )
            },
            { upsert: true }
          );
        console.log(
          chalk.green(
            `Scraped: ${chalk.yellow(
              nugget.data.brand.slug
            )} with ${chalk.yellow(total_products_count)} products`
          )
        );
        await sleep(HOW_POLITE_DELAY);
      }
    }
  }
  await connection.close();
  return console.log(chalk.bgBlue.white("🌿 All Done! 🌿"));
})();
