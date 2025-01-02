import fs from "fs";
import path from "path";

const dirPath = "./"; // Starting directory of your project

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
      convertRequireToImport(filePath);
    }
  });
}

// Function to convert require to import and add extensions
function convertRequireToImport(filePath) {
  let fileContent = fs.readFileSync(filePath, "utf8");

  // Replace require statements with import statements, and append file extensions
  const requireRegex = /const\s+(\w+)\s*=\s*require\(['"](.+)['"]\);/g;
  const importStatements = fileContent.replace(
    requireRegex,
    (match, variable, module) => {
      // Determine if the module already has an extension or not
      if (!/\.[a-z]+$/i.test(module)) {
        // If no extension is provided, assume '.js' for local files
        if (module.startsWith(".")) {
          module += ".js";
        }
      }
      return `import ${variable} from '${module}';`;
    }
  );

  // Only overwrite if changes were made
  if (importStatements !== fileContent) {
    fs.writeFileSync(filePath, importStatements, "utf8");
    console.log(`Updated file: ${filePath}`);
  }
}

// Start the conversion process
traverseDirectory(dirPath);
