import express from "express";

const app = express();
const port = process.env.PORT || 3000;

for (const value of [1, 2, 3]) console.log("value");

app.listen(port, () => console.log(`Server: http://localhost:${port}`));
