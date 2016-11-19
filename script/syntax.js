#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const languages = ["ocaml"];

function inPath(language) {
  return path.resolve(".", "out", "src", "syntaxes", language);
}

function outPath(language) {
  return path.resolve(".", "syntaxes", `${language}.json`);
}

for (const language of languages) {
  const from = inPath(language);
  const into = outPath(language);
  const data = require(from);
  const json = JSON.stringify(data.default);
  fs.writeFileSync(into, json);
}
