import { atom } from "recoil";

interface IProgress {
  id: number;
  name: string;
  progress: number;
  errorCount: number;
  controller: AbortController;
}

interface ICopyQ {
  id: number;
  name: string;
  controller: AbortController;
}

//SSH FS data
export const uploadQState = atom<IProgress[]>({
  key: "uploadQState",
  default: [],
});

export const downloadQState = atom<IProgress[]>({
  key: "downloadQState",
  default: [],
});

export const copyQState = atom<ICopyQ[]>({
  key: "copyQState",
  default: [],
});
