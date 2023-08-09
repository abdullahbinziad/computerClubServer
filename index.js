const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;
require("dotenv").config();


const corsConfig = {

  origin:"*",
  Credential: true ,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}

app.use(express.json());
app.use(cors(corsConfig));

// verify Jwt
// verify the JWT

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unAuthorized Access" });
  }
  //bearre token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECCRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized Access" });
    }

    req.decoded = decoded;
    next();
  });
};



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
    const memberCollection = database.collection("members");

    // making api


 //post jwt request from headers

 app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECCRET, {
    expiresIn: "1h",
  });
  console.log("the generated token", token);
  res.send({ token });
});


//warning: use verify jwt before using verify member
    const verifyMember = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await memberCollection.findOne(query);

      if (user?.role !== "member") {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden message" });
      }
      next();
    };



//for hook verify 

//check is it member --true/false 
app.get('/users/member/:email',verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ member: false })
  }
  const query = { email: email }
  const user = await memberCollection.findOne(query);
  const result = { member: user?.role === 'member' }
  res.send(result);
})





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
          aboutDesc: data.aboutDesc,
          fb: data.fb,
          whatsapp: data.whatsapp,
          linkdin: data.linkdin
        },
      };
      const result = await executivesCollection.updateOne(
        query,
        updateDoc,
        option
      );
      res.send(result);
    });


//member appi

//create a member 

app.post('/createmember', async (req, res) => {
  const user = req.body;
const query = { email: user.email }
const existingUser = await memberCollection.findOne(query);

if (existingUser) {
  return res.send({ message: 'user already exists' })
}
  const result = await memberCollection.insertOne(user);
  res.send(result);
})

//get the member data 

app.get('/member', async (req, res) => {
 const filter = req.query ;
 if (filter && filter.email) {
  query = { email: filter.email };
}
console.log(query);
const result = await memberCollection.find(query).toArray() ;
  res.send(result);

})


//update Member Info 
app.put("/userInfo/:email", async (req, res) => {
  const email = req.params.email;
 
const query = { email: email };

 const user = await memberCollection.findOne(query);
 const filter=  user
console.log(filter);
  const data = req.body;
  const option = { upsert: true };
  const updateDoc = {
    $set: {
    fullname: data.fullname,
    department: data.department,
    batch: data.batch,
    session: data.session,
    studentID: data.studentID,
    },
  };
  const result = await memberCollection.updateOne(
    filter,
    updateDoc,
    option
  );
  res.send(result);
});

//update contact 
app.put("/userContact/:email", async (req, res) => {
  const email = req.params.email;
 
const query = { email: email };

 const user = await memberCollection.findOne(query);
 const filter=  user
console.log(filter);
  const data = req.body;
  const option = { upsert: true };
  const updateDoc = {
    $set: {
    mobile: data.mobile,
    fulladdress: data.fulladdress,
    },
  };
  const result = await memberCollection.updateOne(
    filter,
    updateDoc,
    option
  );
  res.send(result);
});
//update soocial 


app.put("/userSocial/:email", async (req, res) => {
  const email = req.params.email;
 
const query = { email: email };


  const newSocialLinks = req.body;
  const result = await memberCollection.findOneAndUpdate(
    { email: email },
    { $set: { socialLink: newSocialLinks } },
    { returnOriginal: false }
  );

  if (!result.value) {
    return res.status(404).json({ message: 'Document not found' });
  }
  res.json({ message: 'Social links updated successfully', document: result.value });

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
