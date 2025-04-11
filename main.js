// Import the transformers pipeline from Xenova
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.11.0';

// Declare variables for code generator and pyodide
let generator;
let pyodide;

// Initialize both the local code model and Pyodide
(async () => {
  console.log("Loading model and Python...");
  generator = await pipeline('text-generation', 'Xenova/codegen-350M-mono');
  pyodide = await loadPyodide();
  console.log("Ready!");
})();

// Handle prompt input and code execution
async function generateCode() {
  const prompt = document.getElementById("prompt").value.trim();
  const language = document.getElementById("language").value;
  const output = document.getElementById("output");

  if (!prompt) {
    output.textContent = "Please enter a prompt first.";
    return;
  }

  output.textContent = "Generating code locally...";

  // Prefix to help guide the model
  const langHint = language === 'js' ? '// JavaScript' : '# Python';

  try {
    const generated = await generator(`${prompt}\n${langHint}\n`, {
      max_new_tokens: 256,
      temperature: 0.8,
    });

    // Get just the generated code (skip prompt and comments)
    const code = generated[0].generated_text
      .split('\n')
      .slice(2)
      .join('\n')
      .trim();

    output.textContent = code;

    // Execute the code depending on the selected language
    if (language === 'js') {
      try {
        eval(code);
      } catch (e) {
        console.error("JavaScript error:", e);
        output.textContent += `\n\n⚠️ JavaScript Error: ${e}`;
      }
    } else if (language === 'python') {
      try {
        const result = await pyodide.runPythonAsync(code);
        if (result !== undefined) {
          output.textContent += `\n\n🟢 Python Output:\n${result}`;
        }
      } catch (e) {
        console.error("Python error:", e);
        output.textContent += `\n\n⚠️ Python Error: ${e}`;
      }
    }

  } catch (err) {
    console.error("Generation error:", err);
    output.textContent = `❌ Error generating code: ${err}`;
  }
}
