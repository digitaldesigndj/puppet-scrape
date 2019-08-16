const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.leafly.com/brands/select-oil");
  // await page.addScriptTag({
  //   url: "https://code.jquery.com/jquery-3.2.1.min.js"
  // });
  await page.evaluate(() => {
    localStorage.setItem("isAgeVerified", true);
  });

  await page.screenshot({ path: "example.png" });
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
