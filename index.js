const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.idgt1xz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // DATABASE CREATE
    const jobCollection = client.db("jobPortalDB").collection("jobs");
    const indexKeys = { title: 1, category: 1 };
    const indexOptions = { name: "titleCategory" };
    const result = await jobCollection.createIndex(indexKeys, indexOptions);
    console.log(result);
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // my job get
    app.get("/myJob/:email", async (req, res) => {
      const email = req.params.email;
      const result = await jobCollection.find({ postedBy: email }).toArray();
      res.send(result);
    });

    // job get
    app.get("/allJobsByCategory/:category", async (req, res) => {
      const category = req.params.category;
      if (category === "remote" || category === "offline") {
        const result = await jobCollection.find({ status: category }).toArray();
        return res.send(result);
      }
      const result = await jobCollection.find({}).toArray();
      res.send(result);
    });

    // job post
    app.post("/jobPost", async (req, res) => {
      const body = req.body;
      console.log(body);
      if (Object.keys(body).length !== 0) {
        body.createdAt = new Date();
        const result = await jobCollection.insertOne(body);
        if (result?.insertedId) {
          return res.status(200).send(result);
        } else {
          return res.status(404).send({
            error: "can not insert try again later",
            status: false,
          });
        }
      } else {
        return res.status(404).send({
          error: "empty data",
          status: false,
        });
      }
    });

    // search job get
    app.get("/getSearchJob/:text", async (req, res) => {
      const text = req.params.text;
      const result = await jobCollection
        .find({
          $or: [
            { title: { $regex: text, $options: "i" } },
            { category: { $regex: text, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("job portal server");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
