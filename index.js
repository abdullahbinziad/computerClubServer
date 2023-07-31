const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb://127.0.0.1:27017/clubDB`;

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
    const database = client.db("clubDB");
    const executivesCollection = database.collection("executives");

    // making api

    //get api of executive
    app.get("/executives", async (req, res) => {
      const result = await executivesCollection.find({}).toArray();
      res.send(result);
    });
    //get single api of executive
    app.get("/executives/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await executivesCollection.findOne(query);
      res.send(result);
    });

    //post api of executives

    app.post("/addexecutives", async (req, res) => {
      const data = await req.body;
      const result = await executivesCollection.insertOne(data);
      res.send(result);
    });

    //Delete Api for Executives

    app.delete("/deleteExecutive/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await executivesCollection.deleteOne(query);
      res.send(result);
    });

    //update a single executives
    app.put("/updateExecutive/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          name: data.name,
          position: data.position,
          batch: data.batch,
          department: data.department,
          email: data.email,
          mobile: data.mobile,
          image: data.image,
        },
      };
      const result = await executivesCollection.updateOne(
        query,
        updateDoc,
        option
      );
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();s
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
