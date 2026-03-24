const fs = require('fs');
const html = fs.readFileSync('d:\\apps\\HedwigPost\\public\\admin\\editor.html', 'utf8');

// We want to test the script execution
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

// Mock APIs
window.fetch = async () => ({
  json: async () => ([])
});
window.localStorage = { getItem: () => 'token', setItem: () => {} };

// Try calling importDocument
try {
  document.getElementById('importDocText').value = "My Great Title\n\nThis is a test post that has some body content about AI.";
  window.importDocument();
  console.log("SUCCESS:");
  console.log("Title:", document.getElementById('postTitle').value);
  console.log("Content:", document.getElementById('editorContent').innerHTML);
} catch (e) {
  console.error("ERROR:", e);
}
