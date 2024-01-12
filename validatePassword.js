/* const bcrypt = require("bcrypt");

const comparing = async () => {
  const hashedPassword = await bcrypt.hash("ganesh@2002", 20);
  console.log(`Hashed Password is ${hashedPassword}`);

  const isTrue = await bcrypt.compare("ganesh@2002", hashedPassword);

  console.log(isTrue);
};
    
comparing(); */

const line = "Bearer 893873u8uhduihuhd";
const [h1, h2] = line.split(" ");
console.log(h1);
console.log(h2);
