export interface User {
  _id: string;
  username: string;
  emoji: string;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participants: [string, string];
  updatedAt: string;
}

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text: string;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  participants: string;
  updatedAt: string;
}

interface Database {
  users: User[];
  chats: Chat[];
  messages: Message[];
  groups: Group[];
}

const database: Database = {
  users: [
    {
      _id: "1",
      username: "test-username",
      emoji: "😂",
      createdAt: new Date().toISOString(),
    },
  ],
  chats: [
    {
      _id: "1",
      participants: ["1", "2"],
      updatedAt: new Date().toISOString(),
    },
  ],
  messages: [
    {
      _id: "1",
      chatId: "1",
      sender: "1",
      createdAt: new Date().toISOString(),
      text: "Hello madafaka",
    },
  ],
  groups: [],
};

export default database;
