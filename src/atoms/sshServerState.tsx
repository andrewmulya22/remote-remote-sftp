import { atom } from "recoil";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  children?: IChildren[];
}

//SSH FS data
export const SSHFilesState = atom<IChildren[]>({
  key: "SSHFilesState",
  default: [],
});

//folder lists on the right container
export const SSHfolderListsState = atom<string[]>({
  key: "SSHfolderListsState",
  default: [],
});

export const selectedSSHFolderState = atom<string>({
  key: "selectedSSHFolderState",
  default: "",
});

export const selectedSSHComponentState = atom<string>({
  key: "selectedSSHComponentState",
  default: "",
});
