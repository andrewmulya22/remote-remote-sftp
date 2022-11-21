import { atom } from "recoil";

export const URLState = atom<string>({
  key: "URLState",
  default: "",
});
