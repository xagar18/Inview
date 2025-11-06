import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  DB_URL: process.env.DB_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
};
