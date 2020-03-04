export default function folderPathToBreadMap(folderPath) {
  const folderNames = folderPath.split('/');
  folderNames.shift();
  const folderPaths = [];
  folderNames.forEach((folderName, index) => {
    const parent = index ? folderPaths[index - 1] : '';
    folderPaths.push( `${parent}/${folderName}` );
  });
  const folders = new Map();
  folderNames.forEach((folderName, i) => {
    folders.set(folderName, folderPaths[i]);
  });
  return folders;
}