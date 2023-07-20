import { PROFANITY } from "./profanity_corpus";
import { Rarity, Type } from "./types";

export function logError(error: unknown) {
  console.log(error);
}

export function rarityValidator(value: any): value is Rarity {
  return Object.values(Rarity).includes(value);
}

export function limitValidator(value: any) {
  return [0, 25, 50, 75, 100].includes(Number(value));
}

export function durationValidator(value: any) {
  return [1, 7, 31, 365].includes(Number(value));
}

export function typeValidator(value: any): value is Type {
  return Object.values(Type).includes(value);
}

export function parseDeckResponse(deck: Record<string, unknown>) {
  [
    "magicCardOne",
    "magicCardTwo",
    "magicCardThree",
    "magicCardFour",
    "magicCardFive",
    "magicCardSix",
    "magicCardSeven",
    "magicCardEight",
    "companionCardOne",
    "companionCardTwo",
    "companionCardThree",
  ].forEach((key) => {
    if (deck[key]) {
      deck[key] = JSON.parse(deck[key] as string);
    }
  });
  return deck;
}

export function isTextExplicit(text: string) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .some((word) => PROFANITY.has(word));
}
