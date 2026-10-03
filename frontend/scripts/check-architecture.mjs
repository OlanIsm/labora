import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const root = process.cwd();
const config = ts.readConfigFile(join(root, "tsconfig.json"), ts.sys.readFile);
const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const publicEntries = new Set(["index.ts", "model.ts", "ui.ts", "routes.ts"]);
const errors = [];
const graph = new Map();

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".next")) return [];
    if (
      ["node_modules", ".next", "tests", "public", "scripts"].includes(
        entry.name,
      )
    )
      return [];
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.tsx?$/.test(path)
        ? [path]
        : [];
  });
}

function location(path) {
  return relative(root, path).replaceAll("\\", "/");
}

for (const file of sourceFiles(root)) {
  const sourcePath = location(file);
  const feature = sourcePath.match(/^features\/([^/]+)\//)?.[1];
  const domain = sourcePath.includes("/domain/");
  const ast = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const inspect = (node) => {
    const specifier =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0]
          : null;
    if (specifier && ts.isStringLiteral(specifier)) {
      const spec = specifier.text;
      const target = ts.resolveModuleName(spec, file, options, ts.sys)
        .resolvedModule?.resolvedFileName;
      const targetPath = target ? location(target) : spec;
      const targetFeature = targetPath.match(/^features\/([^/]+)\/(.+)$/);
      const report = (message) =>
        errors.push(`${sourcePath}: ${message} (${spec})`);
      if (
        sourcePath.startsWith("shared/") &&
        /^(features|application|app)\//.test(targetPath)
      )
        report("shared must not depend on application features");
      if (feature && /^(application|app)\//.test(targetPath))
        report("features must not depend on the composition layer");
      if (
        targetFeature &&
        targetFeature[1] !== feature &&
        !publicEntries.has(targetFeature[2]) &&
        !spec.endsWith(".css")
      )
        report("cross-module imports must use a public entry point");
      if (
        domain &&
        (/^(react|next|@supabase\/|@dnd-kit\/)/.test(spec) ||
          /\/(ui|infrastructure|application)\//.test(targetPath))
      )
        report("domain code must stay independent of UI and infrastructure");
      if (
        feature &&
        targetFeature &&
        feature !== targetFeature[1] &&
        targetFeature[2] !== "model.ts" &&
        !node.importClause?.isTypeOnly &&
        !node.isTypeOnly
      ) {
        if (!graph.has(feature)) graph.set(feature, new Set());
        graph.get(feature).add(targetFeature[1]);
      }
    }
    ts.forEachChild(node, inspect);
  };
  inspect(ast);
}

function visit(feature, ancestors = []) {
  if (ancestors.includes(feature)) {
    errors.push(
      `Runtime module dependency cycle: ${[...ancestors, feature].join(" -> ")}`,
    );
    return;
  }
  for (const dependency of graph.get(feature) || [])
    visit(dependency, [...ancestors, feature]);
}
for (const feature of graph.keys()) visit(feature);
assert.equal(
  errors.length,
  0,
  `Architecture violations:\n${errors.join("\n")}`,
);
console.log(
  "Architecture passed: public module boundaries, pure domains, shared isolation, and no runtime module cycles.",
);
