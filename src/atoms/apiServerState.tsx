import { atom } from "recoil";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  children?: IChildren[];
}

//API data
export const fetchingState = atom<boolean>({
  key: "fetchingState",
  default: false,
});

export const filesState = atom<IChildren[]>({
  key: "filesState",
  default: [],
});

//folder lists on the left container
export const folderListsState = atom<string[]>({
  key: "folderListsState",
  default: [],
});

export const selectedFolderState = atom<string>({
  key: "selectedFolderState",
  default: "",
});

export const selectedComponentState = atom<string>({
  key: "selectedComponentState",
  default: "",
});
