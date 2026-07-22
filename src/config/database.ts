import "dotenv/config";
import Knex from "knex";
 
const knex = Knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },

});
 
export const onDatabaseConnect = () => knex.raw("SELECT 1");
 
export default knex;