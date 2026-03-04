import jwt from 'jsonwebtoken'
import {config} from "dotenv";
config();

export const authenticateToken = (req, rep, done) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return rep.code(401).send({ url: req.url, errorMsg: 'Unathorized' });
  }
  jwt.verify(token, process.env.ACCESS_SECRET_KEY, (err, user) => {
    console.log(err)
    if (err) {
      return rep.code(403).send({ url: req.url, errorMsg: 'Invalid token' });
    }
    req.user = user;
  });
  done();
}

export const verifyRefreshToken = (req, rep, done) => {
  const authHeader = req.headers['cookie'];
  const refresh_token = authHeader.split('=')[1];
  if (!refresh_token) {
    return rep.code(401).send({ url: req.url, errorMsg: 'Unauthorized' });
  }
  jwt.verify(refresh_token, process.env.REFRESH_SECRET_KEY, (err, user) => {
    if(err) {
      return rep.code(403).send({ url: req.url, errorMsg: 'Invalid Token' });
    }
    req.user = user;
  });
  done();
}