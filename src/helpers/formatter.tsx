export const unixTimeConverter = (unixTime: number) => {
  const a = new Date(unixTime * 1000);
  const months = [
    "January",
    "Februari",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours();
  const min = a.getMinutes();
  const sec = a.getSeconds();
  const time =
    date + " " + month + " " + year + ", " + hour + ":" + min + ":" + sec;
  return time;
};

export const fileTypeConverter = (unixMode: string) => {
  let directoryCheck = unixMode.slice(2, 3);
  return directoryCheck === "4" ? "Directory" : "File";
};

export const unixModeConverter = (unixMode: string) => {
  //initialize
  let directoryCheck = unixMode.slice(2, 3);
  let permission = unixMode.slice(-3);
  let convertedMode = "";
  const value_letter = ["r", "w", "x"];
  //directory or file check
  if (directoryCheck === "4") convertedMode += "d";
  else convertedMode += "-";
  //iterate to get rwx mode
  for (let i = 0; i < 3; i++) {
    let startNum = 4;
    let comparedNum = parseInt(permission.charAt(i));
    for (let j = 0; j < 3; j++) {
      if (comparedNum >= startNum) {
        convertedMode += value_letter[j];
        comparedNum = comparedNum - startNum;
      } else convertedMode += "-";
      startNum = startNum / 2;
    }
  }

  return convertedMode;
};

export const numberWithCommas = (x: number) => {
  return (
    x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    " bytes (" +
    humanFileSize(x) +
    ")"
  );
};

function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}
