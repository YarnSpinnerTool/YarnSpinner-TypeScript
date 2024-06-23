import csv
import json

# Write string table
dict = []
with open('Output.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        text = row['text'];
        text = text.replace("\\", "\\\\" );
        text = text.replace("\"", "\\\"" );
        dict.append(f"\"{row['id']}\":\"{text}\"")

output = ",".join(dict)
opener = "const stringTable: { [key: string]: string } = {";
ender = "};"
print(f'{opener}{output}{ender}')

# Write metadata table
dict = []
with open('Output-metadata.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # id,node,lineNumber,tags
        entry = {
            x:row[x] for x in ['id','node','lineNumber']
        }
        entry["tags"] = row["tags"].split(" ")
        text = json.dumps(entry)

        # text = text.replace("\\", "\\\\" );
        # text = text.replace("\"", "\\\"" );
        dict.append(f"\"{row['id']}\":{text}")

output = ",".join(dict)
opener = "const metadataTable: { [key: string]: MetadataEntry } = {";
ender = "};"
print(f'{opener}{output}{ender}')

# Write compiled program
hex = []
with open("Output.yarnc", "rb") as f:
    while (byte := f.read(1)):
        hex.append("0x" + byte.hex())

output = ",".join(hex)
opener = "const data = Uint8Array.from([";
ender = "]);";
print(f'{opener}{output}{ender}')
