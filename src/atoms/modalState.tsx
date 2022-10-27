import { atom } from "recoil";

interface INewFolderModal {
  opened: boolean;
  type: string;
  server: "api" | "ssh" | "";
}

interface IEditModal {
  opened: boolean;
  server: "api" | "ssh" | "";
}

export const newFolderModalState = atom<INewFolderModal>({
  key: "newFolderModalState",
  default: {
    opened: false,
    type: "",
    server: "",
  },
});

export const editModalState = atom<IEditModal>({
  key: "editModalState",
  default: {
    opened: false,
    server: "",
  },
});
