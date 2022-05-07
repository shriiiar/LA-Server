const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

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

        app.get('/carsCount', async (req, res) => {
            const count = await carsCollection.estimatedDocumentCount();
            res.send({ count });
        })

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
                    name: newItem.name, description: newItem.description, price: newItem.price, img: newItem.img, supplierName: newItem.supplierName, quantity: newItem.quantity, stock: newItem.stock
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

        app.get('/myItems', verifyJWT, async (req, res) => {
            const reqEmail = req.decoded.email;
            const email = req.query.email;
            if (email === reqEmail) {
                const query = { email: email };
                const cursor = carsCollection.find(query);
                const myItems = await cursor.toArray();
                res.send(myItems);
            }
            else {
                res.status(403).send({ message: 'Forbidden access' })
            }
        })

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })
    }
    finally {
        // console.log('gg');
     }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server Is Running..');
})

app.listen(port, () => {
    console.log('Listening..');
})