import fs from "fs";
import path from "path";

const dirPath = "./src"; // Starting directory of your project

// Function to recursively search through all files in the directory
function traverseDirectory(directory) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    // If it's a directory, recurse into it
    if (stat.isDirectory()) {
      traverseDirectory(filePath);
    } else if (filePath.endsWith(".js")) {
      convertModuleExportsToDefault(filePath);
    }
  });
}

// Function to convert module.exports to export default
function convertModuleExportsToDefault(filePath) {
  let fileContent = fs.readFileSync(filePath, "utf8");

  // Replace module.exports = X with export default X
  const moduleExportsRegex = /module\.exports\s*=\s*(.+);/g;
  const updatedContent = fileContent.replace(
    moduleExportsRegex,
    (match, exportedValue) => {
      return `export default ${exportedValue};`;
    }
  );

  // Only overwrite if changes were made
  if (updatedContent !== fileContent) {
    fs.writeFileSync(filePath, updatedContent, "utf8");
    console.log(`Updated file: ${filePath}`);
  }
}

// Start the conversion process
traverseDirectory(dirPath);
