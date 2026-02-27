import os
import re

schema_path = "anavi/drizzle/schema.ts"
out_dir = "anavi/drizzle/schema"
os.makedirs(out_dir, exist_ok=True)

with open(schema_path, "r") as f:
    schema_content = f.read()

# First extract all export type statements
type_regex = r'export type (\w+) = (typeof (\w+)\.\$inferSelect|typeof (\w+)\.\$inferInsert);'
type_matches = list(re.finditer(type_regex, schema_content))

types = {}
type_to_table = {}
for m in type_matches:
    full_text = m.group(0)
    type_name = m.group(1)
    table_ref = m.group(3) if m.group(3) else m.group(4)
    types[type_name] = full_text
    type_to_table[type_name] = table_ref

# Remove all export type statements to avoid duplication in table matching
schema_content_no_types = re.sub(type_regex, '', schema_content)

# Now find tables
table_matches = re.finditer(r'(// =+[\s\S]*?)?export const (\w+) = mysqlTable\("([^"]+)",\s*\{(.*?)\}\);', schema_content_no_types, re.DOTALL)

tables = {}
for m in table_matches:
    full_text = m.group(0).strip()
    name = m.group(2)
    tables[name] = full_text

# Buckets
buckets = {
    "users": ["users", "verificationDocuments", "trustScoreHistory", "peerReviews", "relationships", "contactHandles", "userFlags", "notifications"],
    "matching": ["intents", "matches", "transactionCriteria", "transactionMatches", "verificationProofs"],
    "deals": ["deals", "dealParticipants", "dealRooms", "dealRoomAccess", "documents", "documentSignatures", "ndaTemplates", "escrowAccounts", "payouts", "wireInstructions", "spvs", "capTableEntries", "capitalCommitments", "capitalCalls", "capitalCallResponses", "lpProfiles"],
    "compliance": ["complianceChecks", "auditLog", "auditLogs", "complianceChecklists"],
}

file_mapping = {}
for name in tables.keys():
    assigned = "assets"  # Default
    for bucket_name, bucket_tables in buckets.items():
        if name in bucket_tables:
            assigned = bucket_name
            break
    file_mapping[name] = assigned

for type_name, table_ref in type_to_table.items():
    file_mapping[type_name] = file_mapping.get(table_ref, "assets")

files_content = {k: [] for k in buckets.keys()}
files_content["assets"] = []

for name, text in tables.items():
    files_content[file_mapping[name]].append(text)

for name, text in types.items():
    files_content[file_mapping[name]].append(text)

import_str = "import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from \"drizzle-orm/mysql-core\";\n"

for current_file, items in files_content.items():
    if not items:
        continue
    content = "\n\n".join(items)
    # Find dependencies
    deps = set()
    for exported_name, owner_file in file_mapping.items():
        if owner_file != current_file:
            if re.search(r'\b' + exported_name + r'\b', content):
                deps.add((exported_name, owner_file))
    
    deps_by_owner = {}
    for name, owner in deps:
        if owner not in deps_by_owner:
            deps_by_owner[owner] = []
        deps_by_owner[owner].append(name)
    
    imports_to_add = import_str
    for owner, names in deps_by_owner.items():
        imports_to_add += f"import {{ {', '.join(names)} }} from \"./{owner}\";\n"
    imports_to_add += "\n"
    
    with open(f"{out_dir}/{current_file}.ts", "w") as f:
        f.write(imports_to_add + content + "\n")

index_exports = [f"export * from './{k}';\n" for k in files_content.keys() if files_content[k]]
with open(f"{out_dir}/index.ts", "w") as f:
    f.writelines(index_exports)

print("Remapping complete.")
