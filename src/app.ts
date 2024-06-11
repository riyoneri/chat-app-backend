import express from "express";
import helmet from "helmet";

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.disable("x-powered-by");

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Server: http://localhost:${port}`));
