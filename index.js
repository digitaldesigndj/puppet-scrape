const puppeteer = require("puppeteer");
const fs = require("fs");
const util = require("util");

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

// client.connect(function(err) {
//   assert.equal(null, err);
//   console.log("Connected successfully to server");
//
//   const db = client.db(dbName);
//
//   insertDocuments(db, function() {
//     client.close();
//   });
// });

// const connect = util.promisify(client.connect);

const handleMessage = msg => {
  for (let i = 0; i < msg.args().length; ++i)
    console.log(`${i}: ${msg.args()[i]}`);
};

// var collectionPromise = () => {
//   return new Promise((resolve, reject) => {
//     db.collection("leafly.com/brands", function(err, data) {
//       err ? reject(err) : resolve(data);
//     });
//   });
// };

const insertMany = (connection, THE_PAYLOAD) => {
  return new Promise((resolve, reject) => {
    connection
      .db("puppet-scrape")
      .collection("leafly.com/brands")
      .insertMany(THE_PAYLOAD, (err, result) => {
        // assert.equal(err, null);
        console.log(`DB Stuff Done: ${result.ops.length}`);
        return err ? reject(err) : resolve(result);
      });
  });
};

(async () => {
  const browser = await puppeteer.launch({ headless: false, viewport: null });
  const page = await browser.newPage();
  const client = new MongoClient("mongodb://localhost:27017");
  const connection = await client.connect();
  // await page.evaluate(() => {
  //   localStorage.setItem("isAgeVerified", true);
  // });
  await page.goto("https://www.leafly.com/brands");
  await page.click("#tou-continue");
  await page.waitFor(1000);
  console.log("Done Waiting");
  // const widths = ["320px", "768px", "1000px", "1280px", "1920px"];
  // const widths = [320, 768, 1000, 1280, 1920];
  // for (let width of widths) {
  //   await page.setViewport({ height: 3000, width });
  //   await page.screenshot({ path: `example${width}.png` });
  //   console.log(`Click! ${width}`);
  // }

  const item_names_links = await page.evaluate(selector => {
    const node_list = document.querySelectorAll(selector);
    const items = [...node_list];
    return items.map(item => {
      let thing = {};
      thing.href = item.href;
      thing.text = item.innerText.trim();
      return thing;
    });
  }, ".item");
  // console.log(item_names_links);
  fs.writeFileSync("./data.json", JSON.stringify([...item_names_links]));
  await insertMany(connection, [...item_names_links]);
  await client.close();
  // connection
  //   .db("puppet-scrape")
  //   .collection("leafly.com/brands")
  //   .insertMany([...item_names_links], (err, result) => {
  //     assert.equal(err, null);
  //     console.log(`DB Stuff Done: ${result.ops.length}`);
  //     client.close();
  //   });

  // await page.addScriptTag({
  //   url: "https://code.jquery.com/jquery-3.2.1.min.js"
  // });
  // await page.screenshot({ path: "example.png" });
  // let stuff;
  // const result = await page.evaluate(stuff => {
  //   stuff = $(".item").map((i, thing) => {
  //     // console.log( thing )
  //     return thing.href;
  //   });
  //   return Promise.resolve(
  //     $(".item").map((i, thing) => {
  //       // console.log( thing )
  //       return thing.href;
  //     })
  //   );
  //
  //   // console.log(awesome);
  //
  //   // return jQuery(".item").map((i, v) => {
  //   //   let information = new Object();
  //   //   information.href = v.href;
  //   //   information.text = v.innerText.trim();
  //   //   return information;
  //   // });
  //   // console.log(thing);
  //   // fs.writeFileSync("./data.json", JSON.stringify(thing));
  // }, stuff);
  // const nodes = await page.$$(".item");
  // console.log(nodes, "TAYLOR");

  //   await page.goto(brand.href);
  //   await page.screenshot({
  //     path:
  //       brand.text
  //         .toLowercase()
  //         .replace(" ", "_")
  //         .replace(/[^a-z0-9]/gi, "") + ".png"
  //   });
  // }

  // .toLowercase().replace(' ', '_').replace(/[^a-z0-9]/gi,'')

  // const title = await page.evaluate(() => {
  //   const $ = window.$; //otherwise the transpiler will rename it and won't work
  //   return $("h1 > span").text();
  // });
  // console.log(title);
  // await page.$(".sidebar-main .website a").attr("href");
  // var website = $(".sidebar-main .website a").attr("href");
  // var title = $("hgroup.brand-title h1").text();
  // var subheading = $("hgroup.brand-title h2").text();
  // var about = $(".brand-description").text();

  await browser.close();
})();
