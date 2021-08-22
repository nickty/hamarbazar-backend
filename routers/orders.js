/** @format */

const express = require('express');
const { Order } = require('../models/order');
const { OrderItem } = require('../models/orderItem');
const router = express.Router();

router.post(`/`, async (req, res) => {
  const orderItemIds = Promise.all(
    req.body.orderItems.map(async (orderitem) => {
      let newOrderItem = new OrderItem({
        quantity: orderitem.quantity,
        product: orderitem.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );
  const orderItemIdsResolved = await orderItemIds;

  const totalPrices = await Promise.all(
    orderItemIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        'product',
        'price'
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;

      return totalPrice;
    })
  );

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
  });
  // order = await order.save();

  if (!order) return res.status(404).send('The order can not be created');

  res.send(order);
});

router.get(`/`, async (req, res) => {
  const order = await Order.find()
    .populate('user', 'name')
    .sort({ dateOrdered: -1 });
  if (!order) {
    res.status(500).json({
      success: false,
    });
  }
  res.send(order);
});

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({
      path: 'orderItems',
      populate: { path: 'product', populate: 'category' },
    });
  if (!order) {
    res.status(500).json({
      success: false,
    });
  }
  res.send(order);
});

router.put('/:id', async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    {
      new: true,
    }
  );

  if (!order) return res.status(404).send('The order can not be updated');

  res.send(order);
});

router.delete('/:id', (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndRemove(orderItem);
        });
        return res.status(200).json({
          success: true,
          message: 'order is deleted',
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'order not found',
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        error: err,
      });
    });
});

router.get('/get/totalsales', async (req, res) => {
  const totalsales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } },
  ]);

  if (!totalsales) {
    return res.status(400).send('The order sales cannot be generated');
  }

  res.send({
    totalsales: totalsales.pop().totalsales,
  });
});

router.get(`/get/count`, async (req, res) => {
  const orderCount = await Order.countDocuments((count) => count);

  if (!orderCount) {
    res.status(500).json({
      success: false,
    });
  }
  res.send({ count: orderCount });
});

router.get(`/get/userorders/:userid`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid }).populate({
    path: 'orderItems',
    populate: { path: 'product', populate: 'category' },
  });
  if (!userOrderList) {
    res.status(500).json({
      success: false,
    });
  }
  res.send(userOrderList);
});

module.exports = router;
