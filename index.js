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

const insertMany = (connection, THE_PAYLOAD) => {
  return new Promise((resolve, reject) => {
    connection
      .db("puppet-scrape")
      .collection("leafly.com/brands")
      .insertMany(THE_PAYLOAD, (err, result) => {
        console.log(`DB Stuff Done: ${result.ops.length}`);
        return err ? reject(err) : resolve(result);
      });
  });
};

(async () => {
  const browser = await puppeteer.launch({ headless: false, viewport: null });
  const page = await browser.newPage();
  const connection = await MongoClient.connect();

  await page.goto("https://www.leafly.com/brands");
  await page.click("#tou-continue");
  await page.waitFor(1000);

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

  fs.writeFileSync("./data.json", JSON.stringify([...item_names_links]));
  await insertMany(connection, [...item_names_links]);
  await MongoClient.close();
  await browser.close();
})();
