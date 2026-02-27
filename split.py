import os

schema_path = "anavi/drizzle/schema.ts"
out_dir = "anavi/drizzle/schema"
os.makedirs(out_dir, exist_ok=True)

with open(schema_path, "r") as f:
    lines = f.readlines()

imports = []
for line in lines:
    if line.startswith("import") or line.startswith("export type") and "from" in line:
        imports.append(line)
        if "}" in line:
             pass
    elif line.strip() == "// " + "=" * 76:
        break

# The imports could be multi-line
import_str = "import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from \"drizzle-orm/mysql-core\";\n\n"

modules = {}
current_module = "index"

i = 0
while i < len(lines):
    line = lines[i]
    if line.strip() == "// " + "=" * 76:
        i += 1
        header_line = lines[i].replace("//", "").strip()
        i += 1
        current_module = header_line.replace("/", "_").replace("&", "_").replace(" ", "_").replace("(", "").replace(")", "").lower()
        if current_module not in modules:
            modules[current_module] = []
        modules[current_module].append(f"// ============================================================================\n// {header_line}\n// ============================================================================\n")
    elif i > 0 and (line.startswith("import ") and "drizzle-orm" in line):
        pass # skip standard import
    else:
        if current_module not in modules:
             modules[current_module] = []
        modules[current_module].append(line)
    i += 1

# Generate index.ts
index_exports = []
for mod, content in modules.items():
    if not "".join(content).strip():
         continue
    if mod == "index":
        continue
        
    file_name = f"{out_dir}/{mod}.ts"
    with open(file_name, "w") as f:
         f.write(import_str + "".join(content))
    index_exports.append(f"export * from './{mod}';\n")

with open(f"{out_dir}/index.ts", "w") as f:
    f.writelines(index_exports)

print("Split completed.")
