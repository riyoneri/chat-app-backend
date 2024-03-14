import { ImgurClient } from "imgur";

const client = new ImgurClient({
  clientId: process.env.IMGUR_CLIENT_ID,
  clientSecret: process.env.IMGUR_CLIENT_SECRET,
});

export const sendImgurRequest = async (image: Buffer) => {
  const {
    data: { link },
    success,
  } = await client.upload({ image });

  return { link, success };
};
