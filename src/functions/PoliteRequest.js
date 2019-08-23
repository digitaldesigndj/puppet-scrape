const request = require("request");
const util = require("util");
const [getAsync] = [request.get].map(util.promisify);
const chalk = require("chalk");
const urlParse = require("url").parse;
const sleep = util.promisify(setTimeout);

class PoliteRequest {
  constructor(delay) {
    this.HOW_POLITE_DELAY = delay;
    console.log(this);
    this.getDelayAmount = this.getDelayAmount.bind(this);
    this.incrementDelayAmount = this.incrementDelayAmount.bind(this);
    this.get = this.get.bind(this);
  }
  getDelayAmount() {
    return this.HOW_POLITE_DELAY;
  }
  incrementDelayAmount() {
    this.HOW_POLITE_DELAY = this.HOW_POLITE_DELAY + 100;
  }
  async get(url) {
    let thisRequest;
    try {
      thisRequest = await getAsync(url);
    } catch (err) {
      console.error(thisRequest.statusCode, err);
      return null;
    }
    if (thisRequest.statusCode === 200) {
      // await sleep(this.getDelayAmount());
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
        this.incrementDelayAmount();
        console.log(
          chalk.red.inverse(
            `🔥🔥Too Fast!🔥🔥 New Delay: ${chalk.yellow(
              this.getDelayAmount()
            )}`
          )
        );
        await sleep(5000);
        // Try Again
        return await this.get(url);
      }
      // WHAT ABOUT 404? Shift happens
      return console.log(
        chalk.red(
          `Request Issue! ${thisRequest.statusCode} - ${thisRequest.body}`
        )
      );
    }
  }
}
module.exports = PoliteRequest;
