import { relative } from "node:path";

export function formatFileTree(params: {
  projectDir: string;
  createdPaths: string[];
}): string {
  const rootLabel = `${relative(process.cwd(), params.projectDir) || "."}/`;
  const lines = [rootLabel];

  const relPaths = [...params.createdPaths]
    .map((p) => relative(params.projectDir, p))
    .sort();

  relPaths.forEach((p, index) => {
    const isLast = index === relPaths.length - 1;
    const branch = isLast ? "└── " : "├── ";
    lines.push(`${branch}${p}`);
  });

  return lines.join("\n");
}

