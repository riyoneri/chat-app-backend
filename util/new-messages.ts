const newChatsTexts = [
  "Just landed!",
  "New chat!",
  "Chat journey!",
  "Ready to chat!",
  "Chat unlocked",
  "Let the chat begin!",
];

export const getRandomNewText = () => {
  const randomIndex = Math.floor(Math.random() * newChatsTexts.length);
  return newChatsTexts[randomIndex];
};
