import express, { Response } from "express";
import helmet from "helmet";

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.disable("x-powered-by");

app.use((_, response: Response) => {
  response.status(404).send("URL does not exist");
});

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Server: http://localhost:${port}`));
