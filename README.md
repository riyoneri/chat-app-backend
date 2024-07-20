# Chatly Backend

This repository contains the backend code for a real-time chat application. It’s built using Express.js, TypeScript, integrates with MongoDB for data storage and AWS for files storage. Users can send and receive messages in real time.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Make sure you have Node.js (version 20 or higher) installed on your system.
- **npm**: The Node.js package manager is required for installing dependencies.
- **MongoDB**: Set up a MongoDB database (either locally or using a cloud service like MongoDB Atlas).

## Getting started

1. Clone the Repository

```bash
git clone https://github.com/riyoneri/chat-app-backend.git
```

2. Change working director

```bash
cd chat-app-backend
```

3. Install dependencies

```bash
npm install
```

4. Environment Variables: Create a .env file in the root directory with the following variables:

```
# AWS
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-region
AWS_BUCKET_NAME=your-bucket-name
AWS_DISTRIBUTION_DOMAIN_NAME=your-distribution-domain-name

# MONGO DB
MONGODB_URL= your-production-mongodb-url
MONGODB_URL_LOCAL=your-development-mongodb-url

# RESEND
RESEND_API_KEY=your-resend-api-key

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
```

> [!NOTE] > **Amazon S3 (AWS)**: Amazon S3, provided by AWS, is a scalable and reliable cloud-based storage service. It’s ideal for storing user profile pictures and chat attachments in your app.
>
> > [Documentation](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)

> [!NOTE] > **MongoDB**: MongoDB, a flexible NoSQL database, stores data in JSON-like documents. It’s perfect for chat apps due to its adaptability and powerful querying capabilities.
>
> > [Mongoose](https://mongoosejs.com/docs/) &
> > [MongoDb](https://www.mongodb.com/docs/atlas/app-services/functions/mongodb/api/)

> [!NOTE] > **JSON Web Tokens (JWT)**: JWTs (JSON Web Tokens) securely transmit information between parties and are commonly used for authentication and data encryption in chat apps.
>
> > [Documentation](https://www.npmjs.com/package/jsonwebtoken)

5. Run the server

```
npm run dev
```

> [!NOTE]
> The server will run on port `3000` by default. You can change this in the app.ts file.

## Real-Time Chat
We use Socket.io for real-time communication. When a user sends a message, it’s saved to MongoDB and broadcasted to all connected clients.

## Contributing
Feel free to contribute by opening issues or submitting pull requests. Let’s make this chat app even better!

## License
This project is licensed under the MIT License - see the LICENSE file for details.