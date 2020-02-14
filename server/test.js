import { readdir } from 'fs';

const folderPath = '/home/brian/Pictures/';

const returnedFiles = [];
const returnedFolders = [];
readdir(
  folderPath, 
  {withFileTypes:true},
  (err, files) => {
    if (err) { throw err };
    files.forEach((file)=>{
      if ( file.isDirectory() ){
        returnedFolders.push(folderPath + file.name);
      } else { returnedFiles.push(folderPath + file.name) };
    });
    console.log(`returnedFiles ${returnedFiles}`);
    console.log(`returnedFolders ${returnedFolders}`);
  }
);