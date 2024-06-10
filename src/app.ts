import express from "express";

const app = express();
const port = process.env.PORT || 3000;

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Server: http://localhost:${port}`));
