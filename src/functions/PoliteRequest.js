const request = require("request");
const util = require("util");
const [getAsync] = [request.get].map(util.promisify);
const chalk = require("chalk");
const urlParse = require("url").parse;

class PoliteRequest {
  constructor(delay) {
    this.HOW_POLITE_DELAY = delay;
  }
  async request(url) {
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
        this.HOW_POLITE_DELAY = this.HOW_POLITE_DELAY + 100;
        console.log(
          chalk.red.inverse(
            `🔥🔥Too Fast!🔥🔥 New Delay: ${chalk.yellow(HOW_POLITE_DELAY)}`
          )
        );
        await sleep(5000);
        // Try Again
        return await this.request(url);
      }
      console.log(
        chalk.red(
          `Request Issue! ${thisRequest.statusCode} - ${thisRequest.body}`
        )
      );
    }
  }
}
module.exports = PoliteRequest;
