/** @format */
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const { Product } = require('./models/product');
const app = express();

const cors = require('cors');

require('dotenv/config');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(morgan('tiny'));
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(authJwt());

app.use(errorHandler);

const api = process.env.API_URL;

//routes
const categoriesRouter = require('./routers/categories');
const productRouter = require('./routers/products');
const userRouter = require('./routers/users');
const orderRouter = require('./routers/orders');

app.use(`${api}/products`, productRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/orders`, orderRouter);

mongoose
  .connect(process.env.CON_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eshop2',
  })
  .then(() => {
    console.log('Database connection is ready');
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(3000, () => {
  console.log('The serve is started now http://localhost:3000');
});
