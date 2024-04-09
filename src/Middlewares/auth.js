const Jwt = require("jsonwebtoken");

// Auth Api For Decode Jwt Token.
const auth = () => async (req, res, next) => {
  const headerToken = req.headers.authorization;
  if (!headerToken) {
    return res.status(401).json({
      status: 401,
      message: "No token provided.",
    });
  }
  if (headerToken && headerToken.split(" ")[0] !== "Bearer") {
    return res.status(401).json({
      status: 401,
      message: "Invalid token.",
    });
  }
  const token = headerToken && headerToken.split(" ")[1];
  const decodedToken = Jwt.decode(token, process.env.SECRET_KEY);
  if (!decodedToken) {
    return res.status(401).json({
      status: 401,
      message: "Invalid token.",
    });
  }
  req.user = {
    id: decodedToken.id,
  };
  next();
};

module.exports = {
  auth,
};