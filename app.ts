import express, { Express } from "express";

const app: Express = express()

app.listen(5000, () => console.log("[server]: 5000"))