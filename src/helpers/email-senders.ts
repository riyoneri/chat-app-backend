import { Resend } from "resend";

export const sendVerificationEmail = (
  link: string,
  name: string,
  emailDestination: string,
) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  return resend.emails.send({
    from: "Chatly <onboarding@resend.dev>",
    to: [emailDestination],
    subject: "Email verification",
    html: `<!DOCTYPE html>
          <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" style="font-family: 'Urbanist', sans-serif;">
          <head>
            <meta charset="utf-8">
            <meta name="x-apple-disable-message-reformatting">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
          </head>
          <body style="font-family: 'Urbanist', sans-serif;">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
              * {
                font-family: "Urbanist", sans-serif;
              }
            </style>
            <div style="font-family: 'Urbanist', sans-serif; position: fixed; inset: 0; left: 0; top: 0; z-index: 10; background-size: cover; background-position: center; background-image: url('https://mailwind.blob.core.windows.net/website/blurred-background-transparency.jpg')"></div>
            <div style="font-family: 'Urbanist', sans-serif; position: relative; z-index: 20; display: grid; gap: 0; border-radius: 8px; background-color: #fff; padding: 40px 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)">
              <p style="font-family: 'Urbanist', sans-serif; text-align: center">Hey ${name}</p>
              <p style="font-family: 'Urbanist', sans-serif; text-align: center;">Thrilled to see you at Chatly! 😊 Let’s confirm your email to kick things off</p>
              <a href="${link}" style="font-family: 'Urbanist', sans-serif; margin-left: auto; margin-right: auto; border-radius: 6px; background-color: rgb(3,94,104); padding: 4px 16px; color: #fff; text-decoration-line: none">Confirm Email</a>
            </div>
          </body>
          </html>
          `,
  });
};
