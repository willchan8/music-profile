import * as dotenv from "dotenv";

module.exports = async () => {
  dotenv.config({ path: ".env.local" });
};
