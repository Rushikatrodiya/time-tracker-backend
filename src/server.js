require("dotenv").config();
const app = require("./app");
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT;

connectRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
    process.exit(1);
  });

BigInt.prototype.toJSON = function () {
  return this.toString();
};
