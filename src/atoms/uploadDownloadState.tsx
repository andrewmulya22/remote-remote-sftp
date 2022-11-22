import { atom } from "recoil";

interface IProgress {
  id: number;
  name: string;
  progress: number;
  errorCount: number;
}

interface IError {
  id: number;
  counter: number;
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
