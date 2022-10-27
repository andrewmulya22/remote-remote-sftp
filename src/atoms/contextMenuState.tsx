import { atom } from "recoil";

interface IContextMenu {
  server: "api" | "ssh" | "";
  fileLoc: string;
}

export const contextMenuState = atom<IContextMenu>({
  key: "contextMenuState",
  default: {
    server: "",
    fileLoc: "",
  },
});

export const renameStateLeft = atom<boolean>({
  key: "renameStateLeft",
  default: false,
});

export const renameStateRight = atom<boolean>({
  key: "renameStateRight",
  default: false,
});
