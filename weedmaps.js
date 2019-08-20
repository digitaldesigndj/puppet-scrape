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

let total_listings = 1;
let page_size = 100;
let current_offset = 0;
while (current_offset < total_listings) {
  request(
    // "https://api-g.weedmaps.com/discovery/v1/listings?page_size=150&page=1",
    `https://api-g.weedmaps.com/discovery/v1/brands?offset=${current_offset}&page_size=${page_size}`,
    function(error, response, body) {
      const json = JSON.parse(body);
      total_listings = json.meta.total_brands;

      console.error("error:", error); // Print the error if one occurred
      console.log("statusCode:", response && response.statusCode); // Print the response status code if a response was received
      console.log(
        `pagination: total:${json.meta.total_brands} offset:${current_offset} current:${json.data.brands.length}`
      );
      console.log("body:", JSON.parse(body).data.brands.length); // Print the HTML for the Google homepage.
    }
  );
  current_offset = current_offset + page_size;
  console.log(`pagination: total:${total_listings} offset:${current_offset}`);
}
