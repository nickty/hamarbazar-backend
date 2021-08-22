/** @format */

const express = require('express');
const { User } = require('../models/user');
const router = express.Router();
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');

router.post(`/`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    color: req.body.color,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });
  user = await user.save();

  if (!user) return res.status(404).send('The user can not be created');

  res.send(user);
});

router.get(`/`, async (req, res) => {
  const user = await User.find().select('-passwordHash');
  if (!user) {
    res.status(500).json({
      success: false,
    });
  }
  res.send(user);
});

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (!user) {
    res.status(500).json({
      success: false,
    });
  }
  res.status(200).send(user);
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).send('The user not found');
  }

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = JWT.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
        // isRevoked: isRevoked,
      },
      process.env.secret,
      {
        expiresIn: '1d',
      }
    );
    res.status(200).send({
      user: user.email,
      token,
    });
  } else {
    res.status(400).send('Password is wrong');
  }

  return res.status(200).send(user);
});

// async function isRevoked(req, payload, done) {
//   if (!payload.isAdmin) {
//     done(null, true);
//   }

//   done();
// }

router.get(`/get/count`, async (req, res) => {
  console.log('ia m from user count ');
  const userCount = await User.countDocuments((count) => count);

  if (!userCount) {
    res.status(500).json({
      success: false,
    });
  }
  res.send({ count: userCount });
});

router.delete('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).json({
          success: true,
          message: 'user is deleted',
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'user not found',
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

module.exports = router;
