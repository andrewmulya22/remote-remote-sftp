import { atom } from "recoil";

interface IProgress {
  id: number;
  name: string;
  progress: number;
  errorCount: number;
  controller: AbortController;
}

interface ICopyDelQ {
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

export const copyQState = atom<ICopyDelQ[]>({
  key: "copyQState",
  default: [],
});

export const delQState = atom<ICopyDelQ[]>({
  key: "delQState",
  default: [],
});
