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

interface IProperties {
  name: string;
  size: number;
  mode: string;
  uid: number;
  gid: number;
  mtime: number;
  atime: number;
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

export const propertiesModalState = atom<boolean>({
  key: "propertiesModalState",
  default: false,
});

export const propertiesDataState = atom<IProperties>({
  key: "propertiesDataState",
  default: {
    name: "",
    size: 0,
    mode: "",
    uid: 0,
    gid: 0,
    mtime: 0,
    atime: 0,
  },
});
