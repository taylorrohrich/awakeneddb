import { Rarity, Type } from "./types";

export function logError(error: unknown) {
  console.log(error);
}

export function rarityValidator(value: any): value is Rarity {
  return Object.values(Rarity).includes(value);
}

export function typeValidator(value: any): value is Type {
  return Object.values(Type).includes(value);
}
