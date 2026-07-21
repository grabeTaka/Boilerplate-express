import "dotenv/config";
import Knex from "knex";
 
const knex = Knex({
  client: "pg",
  connection: {
    host: `${process.env.DATABASE_URL}`,
    port: 5432,
    user: `${process.env.DB_USER}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_NAME}`,
  },
  pool: {
    min: 2,
    max: 10,
  },
  
});
 
export const onDatabaseConnect = () => knex.raw("SELECT 1");
 
export default knex;