const puppeteer = require("puppeteer");
const fs = require("fs");
const util = require("util");
const MongoClient = new require("mongodb").MongoClient(
  "mongodb://localhost:27017",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

// const insertMany = (connection, THE_PAYLOAD) => {
//   return new Promise((resolve, reject) => {
//     connection
//       .db("puppet-scrape")
//       .collection("leafly.com/brands")
//       .insertMany(THE_PAYLOAD, (err, result) => {
//         console.log(`DB Stuff Done: ${result.ops.length}`);
//         return err ? reject(err) : resolve(result);
//       });
//   });
// };

(async () => {
  const isElementPresent = selector => {
    return document.querySelector(selector) ? true : false;
  };
  const getAttributeMaybe = (selector, attribute) => {
    return document.querySelector(selector) !== null
      ? document.querySelector(selector)[attribute]
      : null;
  };
  // const getMappedSelectorMaybe = (selector, mapFunction) => {
  //   // THAR BE BUGS HERE. mapFunction is hoisted or something and doesnt get into the puppet browser context, just do it inline.
  //   const selection = document.querySelectorAll(selector);
  //   return selection.length > 0 ? [...selection].map(mapFunction) : null;
  // };

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const connection = await MongoClient.connect();

  await page.goto("https://www.leafly.com/brands");
  await page.click("#tou-continue");
  await page.waitFor(1000);

  const TheBrands = await connection
    .db("puppet-scrape")
    .collection("leafly.com/brands")
    .find({})
    .toArray();
  for (const brand of TheBrands) {
    // const brand = { href: "https://www.leafly.com/brands/select-oil" };
    if (brand.website === undefined) {
      await page.goto(brand.href, { waitUntil: "networkidle2" });
      const claimed = await page.evaluate(
        isElementPresent,
        "#claim-brand-button"
      );
      const tagline = await page.evaluate(
        getAttributeMaybe,
        ".brand-title h3",
        "innerText"
      );
      const about = await page.evaluate(
        getAttributeMaybe,
        ".brand-description",
        "innerText"
      );
      const website = await page.evaluate(
        getAttributeMaybe,
        ".website a",
        "href"
      );
      const availability = await page.evaluate(selector => {
        const selection = document.querySelectorAll(selector);
        return selection.length > 0
          ? [...selection].map(e => e.innerText)
          : null;
      }, ".product-availability-list > li");
      const product_categories = await page.evaluate(selector => {
        const selection = document.querySelectorAll(selector);
        return selection.length > 0
          ? [...selection].map(e => e.innerText)
          : null;
      }, "#brand-products .category-header");
      const products = await page.evaluate(selector => {
        const selection = document.querySelectorAll(selector);
        return selection.length > 0
          ? [...selection].map(e => {
              const stuff = {};
              stuff.name = e.querySelector(".product-name")
                ? e.querySelector(".product-name").innerText
                : null;
              stuff.price = e.querySelector(".msrp")
                ? e.querySelector(".msrp").innerText
                : null;
              stuff.href = e.href;
              return stuff;
            })
          : null;
      }, ".item");
      let bodyHTML = await page.evaluate(() => document.body.innerHTML);
      // console.log({
      //   claimed,
      //   tagline,
      //   about,
      //   website,
      //   availability,
      //   product_categories,
      //   products
      // });
      await connection
        .db("puppet-scrape")
        .collection("leafly.com/brands")
        .updateOne(
          { _id: brand._id },
          {
            $set: {
              claimed: claimed,
              tagline: tagline,
              about: about,
              website: website,
              availability: availability,
              product_categories: product_categories,
              products: products,
              bodyHTML: bodyHTML
            }
          }
        );
      await page.waitFor(1000);
    }
  }

  // await page.goto("https://www.leafly.com/brands");
  // await page.click("#tou-continue");
  // await page.waitFor(1000);

  // const widths = ["320px", "768px", "1000px", "1280px", "1920px"];
  // const widths = [320, 768, 1000, 1280, 1920];
  // for (let width of widths) {
  //   await page.setViewport({ height: 3000, width });
  //   await page.screenshot({ path: `example${width}.png` });
  //   console.log(`Click! ${width}`);
  // }

  // const item_names_links = await page.evaluate(selector => {
  //   const node_list = document.querySelectorAll(selector);
  //   const items = [...node_list];
  //   return items.map(item => {
  //     let thing = {};
  //     thing.href = item.href;
  //     thing.text = item.innerText.trim();
  //     return thing;
  //   });
  // }, ".item");
  //
  // fs.writeFileSync("./data.json", JSON.stringify([...item_names_links]));
  // await insertMany(connection, [...item_names_links]);
  await MongoClient.close();
  await browser.close();
})();
