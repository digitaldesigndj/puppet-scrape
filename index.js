const puppeteer = require("puppeteer");
const fs = require("fs");

const handleMessage = msg => {
  for (let i = 0; i < msg.args().length; ++i)
    console.log(`${i}: ${msg.args()[i]}`);
};

(async () => {
  const browser = await puppeteer.launch({ headless: false, viewport: null });
  const page = await browser.newPage();
  // page.on("requestfailed", handleMessage);
  // page.on("console", handleMessage);

  // await page.evaluate(() => {
  //   localStorage.setItem("isAgeVerified", true);
  // });
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
  console.log("Done Waiting");
  const item_names_links = await page.evaluate(selector => {
    const node_list = document.querySelectorAll(selector);
    const items = [...node_list];
    return items.map(item => item.href);
  }, ".item");
  console.log(item_names_links);
  fs.writeFileSync("./data.json", JSON.stringify(item_names_links));
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
