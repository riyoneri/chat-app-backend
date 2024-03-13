const newChatsTexts = [
  "Hello!",
  "Welcome!",
  "Greetings!",
  "Hey there!",
  "Hi!",
  "Excited!",
  "Ready!",
  "Let's chat!",
  "Chat away!",
  "Journey begins!",
  "Adventure time!",
  "Chat time!",
  "New chat!",
  "Let's talk!",
  "Chat journey!",
];

export const getRandomNewText = () => {
  const randomIndex = Math.floor(Math.random() * newChatsTexts.length);
  return newChatsTexts[randomIndex];
};
