import { PathLike, existsSync, mkdirSync, unlink } from "node:fs";

export const ensureDirectory = (path: PathLike) => {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
};

export const deletefile = (path: PathLike) => {
  unlink(path, (error) => error && console.log(error));
};
