// require("dotenv").config();
const chalk = require("chalk");
const fs = require("fs");
console.log(
  chalk.yellow(
    `Welcome to puppet-scrape ${chalk.red(
      process.env.LOGNAME
    )}, all the fun stuff is in /src`
  )
);
const path = "./src";
fs.readdir(path, function(err, items) {
  for (var i = 0; i < items.length; i++) {
    console.log(chalk.green(`${chalk.yellow(i)} ${path}/${items[i]}`));
  }
});
