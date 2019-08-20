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
const chalk = require("chalk");

const [getAsync] = [request.get].map(util.promisify);

// const MongoClient = new require("mongodb").MongoClient(
//   "mongodb://localhost:27017",
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   }
// );
// const connection = await MongoClient.connect();
//
// await page.goto("https://www.leafly.com/brands");
// await page.click("#tou-continue");
// console.log(`I is 21 for sure`);
// await page.waitFor(1000);
//
// const TheBrands = await connection
//   .db("puppet-scrape")
//   .collection("leafly.com/brands")
//   .find({})
//   .toArray();
(async () => {
  let total_listings = 1;
  let page_size = 100;
  let current_offset = 0;
  let firstRequest, brandRequest;
  try {
    firstRequest = await getAsync(
      `https://api-g.weedmaps.com/discovery/v1/brands?offset=${0}&page_size=${1}`
    );
  } catch (err) {
    console.error(err);
    return;
  }
  const json = JSON.parse(firstRequest.body);
  total_listings = json.meta.total_brands;
  console.log(`total_listings ${total_listings}`);
  while (current_offset < total_listings) {
    try {
      console.log(
        `https://api-g.weedmaps.com/discovery/v1/brands?offset=${current_offset}&page_size=${page_size}`
      );
      brandRequest = await getAsync(
        `https://api-g.weedmaps.com/discovery/v1/brands?offset=${current_offset}&page_size=${page_size}`
      );
    } catch (err) {
      console.error(brandRequest.statusCode, err);
      break;
    }
    const singleBrandInfo = JSON.parse(brandRequest.body).data.brands.map(
      brand => {
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
      }
    );
    // Increment
    setTimeout(() => {
      current_offset = current_offset + page_size;
    }, 1000);
    console.log(`next loop: ${current_offset}`, singleBrandInfo);
  }
})();
// for ( current_offset; current_offset < total_listings; )
//   console.log("MADIT");
//   request(
//     // "https://api-g.weedmaps.com/discovery/v1/listings?page_size=150&page=1",
//     `https://api-g.weedmaps.com/discovery/v1/brands?offset=${current_offset}&page_size=${page_size}`,
//     function(error, response, body) {
//       const json = JSON.parse(body);
//       total_listings = json.meta.total_brands;
//       console.log(`total_listings ${total_listings}`);
//
//       console.error(chalk.red("error:"), error); // Print the error if one occurred
//       console.log("statusCode:", response && response.statusCode); // Print the response status code if a response was received
//       console.log(
//         chalk.green(
//           `pagination: total:${chalk.red(
//             json.meta.total_brands
//           )} offset:${current_offset} current:${chalk.yellow(
//             json.data.brands.length
//           )}`
//         )
//       );
//       console.log("body:", JSON.parse(body).data.brands.length); // Print the HTML for the Google homepage.
//       current_offset = current_offset + page_size;
//       console.log(
//         `pagination: total:${total_listings} offset:${current_offset}`
//       );
//     }
//   );
// }
