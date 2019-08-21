const chalk = require("chalk");
const MongoClient = new require("mongodb").MongoClient(
  "mongodb://localhost:27017",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);
(async LIMIT => {
  const connection = await MongoClient.connect();
  let count = 0;
  const dbStuff = await connection
    .db("puppet-scrape")
    .collection("weedmaps.com/brands")
    .find({})
    .toArray();
  // console.log(dbStuff.length);
  // console.log(dbStuff[0]);
  console.log(
    chalk.red(`🔥 Removing all records with more than ${LIMIT} entries. 🔥`)
  );
  for (let thing of dbStuff) {
    if (Object.keys(thing).length > LIMIT) {
      const { _id } = thing;
      await connection
        .db("puppet-scrape")
        .collection("weedmaps.com/brands")
        .deleteOne({ _id });
      count++;
    }
  }
  await connection.close();
  return console.log(
    chalk.green(`🌿 All Done: ${chalk.yellow(count)} entries removed 🌿`)
  );
})(20);
