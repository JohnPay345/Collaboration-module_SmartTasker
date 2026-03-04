import pg from 'pg';
import {config} from 'dotenv';

config();

const {Pool} = pg;

export const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DBNAME,
  port: process.env.PG_PORT,
});

