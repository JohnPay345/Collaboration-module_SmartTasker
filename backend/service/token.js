import jwt from 'jsonwebtoken';
import {config} from "dotenv";
config();

export const generateTokens = (payload) => {
  if(!payload) {
    throw new Error("Payoload is empty");
  }
  const access_token = jwt.sign({...payload, type: "AT"}, process.env.ACCESS_SECRET_KEY, {expiresIn: process.env.ACCESS_TOKEN_LIFE});
  const refresh_token = jwt.sign({...payload, type: "RT"}, process.env.REFRESH_SECRET_KEY, {expiresIn: process.env.REFRESH_TOKEN_LIFE});
  return {access_token, refresh_token};
}

export const decodeToken = (token) => {
  const access_token = token.split(' ')[1]
  const decoded = jwt.decode(access_token);
  return decoded;
}

export const getFieldUser = (token, fields) => {
  const refresh_token = token.split('=')[1];
  const user = jwt.decode(refresh_token);
  let output = {};
  Object.keys(user).filter(key => fields.includes(key) ? output[key] = user[key] : "");
  if(!output) {
    throw new Error(`Not found field: ${fields}`);
  }
  return {...output};
}
