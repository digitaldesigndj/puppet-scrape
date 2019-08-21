// Storefronts
// https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer_services][]=storefront&page_size=100&page=1
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/cloud-9-collective-1/menu_items?page=1&page_size=20

// Weed Doctors
// https://api-g.weedmaps.com/discovery/v1/listings?filter[any_retailer_services][]=doctor&page_size=100&page=1

//
// https://api-g.weedmaps.com/discovery/v1/listings?page_size=150&page=1
//
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/${slug}
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/the-crop
//
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/${slug}/menu_items
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/the-crop/menu_items
// https://api-g.weedmaps.com/discovery/v1/listings/dispensaries/the-crop/menu_items?page_size=150&page=1
//
// https://api-g.weedmaps.com/discovery/v1/brands?page_size=150&page=1
// https://api-g.weedmaps.com/discovery/v1/brands?offset=2400&page_size=100
// https://api-g.weedmaps.com/discovery/v1/brands/${ID}

// const puppeteer = require("puppeteer");
// const fs = require("fs");
const request = require("request");
const util = require("util");
var urlParse = require("url").parse;
const chalk = require("chalk");

const sleep = util.promisify(setTimeout);
const [getAsync] = [request.get].map(util.promisify);
const MongoClient = new require("mongodb").MongoClient(
  "mongodb://localhost:27017",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

console.log(`Hello ${process.env.LOGNAME}`);

process.on("unhandledrejection", event => {
  // Prevent error output on the console:
  event.preventDefault();
  console.log("Reason: " + event.reason);
});

const PAGE_SIZE = 100;
let HOW_POLITE_DELAY = 500;

const getPaginationOffsets = (total_listings, offset) => {
  const length = Math.floor(total_listings / offset) + 1;
  return [...Array(length).keys()].map(v => {
    return v * offset;
  });
};

const fancyRequest = async url => {
  // Takes URL, Gives JS Object, Parses JSON, Throws ERRs
  let thisRequest;
  try {
    thisRequest = await getAsync(url);
  } catch (err) {
    console.error(thisRequest.statusCode, err);
    return null;
  }
  if (thisRequest.statusCode === 200) {
    console.log(
      chalk.bgBlack.white(
        `${chalk.blue(thisRequest.statusCode)} - ${urlParse(url).path.replace(
          "/discovery/v1",
          ""
        )}`
      )
    );
    return JSON.parse(thisRequest.body);
  } else {
    if (thisRequest.statusCode === 429) {
      // Too Many Request, Chill out
      HOW_POLITE_DELAY = HOW_POLITE_DELAY + 100;
      console.log(
        chalk.red.inverse(
          `🔥🔥Too Fast!🔥🔥 New Delay: ${chalk.yellow(HOW_POLITE_DELAY)}`
        )
      );
      await sleep(5000);
      // Try Again
      return await fancyRequest(url);
    }
    console.log(
      chalk.red(
        `Request Issue! ${thisRequest.statusCode} - ${thisRequest.body}`
      )
    );
  }
};

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
  connection.close();
  console.log(chalk.bgBlue.white("🌿 All Done! 🌿"));
})();
