import { existsSync } from "fs";
import { join } from "path";

export function getDuplicateSuffixForFile(
  folderpath: string,
  filename: string,
  fileExtension: string
) {
  let tempFileprefix = filename;
  let suffix = "";
  const MAX_NAME_RETRIES = 100;
  for (let i = 1; i <= MAX_NAME_RETRIES; i++) {
    const tempFilename = tempFileprefix + fileExtension;
    const tempFilepath = join(folderpath, tempFilename);
    if (!existsSync(tempFilepath)) {
      break;
    } else {
      suffix = "(" + i + ")";
      tempFileprefix = filename + suffix;
    }
  }
  return suffix;
}

export function removeDuplicateSuffixFromFilename(filename: string) {
  const suffixRegex = /\((\d+)\)$/;
  const match = filename.match(suffixRegex);

  if (match) {
    // Remove the duplicate suffix
    return filename.replace(suffixRegex, "");
  }

  return filename;
}
