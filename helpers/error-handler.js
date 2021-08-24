/** @format */

function errorHandler(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'The user is not authorized', err });
  }

  if (err.name === 'ValidationError') {
    return res.status(401).json({ message: err });
  }

  return res.status(401).json({ message: err });
}

module.exports = errorHandler;
