import { atom } from "recoil";

interface IChildren {
  type: string;
  name: string;
  path: string;
  modified: number;
  size: number;
  mimetype: string;
  children?: IChildren[];
}

export const connectionTypeState = atom<string>({
  key: "connectionTypeState",
  default: "sftp",
});

//Auth status
export const SSHAuthState = atom<boolean>({
  key: "SSHAuthState",
  default: false,
});

//SSH FS data
export const fetchingSSHState = atom<boolean>({
  key: "fetchingSSHState",
  default: false,
});

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

export const SSHClipboardState = atom<string>({
  key: "SSHClipboardState",
  default: "",
});
