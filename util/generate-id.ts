import { nanoid } from "nanoid";

export function getUserId() {
  return nanoid(10);
}

export function getChatId() {
  return nanoid(15);
}

export function getMessageId() {
  return nanoid();
}

export function getGroupId() {
  return nanoid(10);
}
