const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.user}:${process.env.password}@cluster0.vftdj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        console.log("DB Connected..");
        await client.connect();
        const carsCollection = client.db('Assignment11').collection('Inventory');

        app.get('/inventory', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = carsCollection.find(query);
            let products;
            if (page || size) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            res.send(products);
        });

        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await carsCollection.findOne(query);
            res.send(result);
        })

        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const newItem = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    name: newItem.name, description: newItem.description, price: newItem.price, img: newItem.img, supplierName: newItem.supplierName, quantity: newItem.quantity
                }
            };
            const result = await carsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await carsCollection.deleteOne(query);
            res.send(result);
        })

        app.post('/inventory', async (req, res) => {
            const newCar = req.body;
            const result = await carsCollection.insertOne(newCar);
            res.send(result);
        });

        app.get('/myItems', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { email: email };
            const cursor = carsCollection.find(query);
            const myItems = await cursor.toArray();
            res.send(myItems);
        })
    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server Is Running..');
})

app.listen(port, () => {
    console.log('Listening..');
})