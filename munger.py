import csv

dict = []
with open('Output.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        text = row['text'];
        text = text.replace("\\", "\\\\" );
        text = text.replace("\"", "\\\"" );
        dict.append(f"\"{row['id']}\":\"{text}\"")

output = ",".join(dict)
opener = "export const stringTable: { [key: string]: string } = {";
ender = "};"

# create a TS file that exports expected values
tsCompiledOutput = open('typescript-embeddable.ts', 'w+')
tsCompiledOutput.write(f'{opener}{output}{ender}')
tsCompiledOutput.write('\n\n')
print(f'{opener}{output}{ender}')

hex = []
with open("Output.yarnc", "rb") as f:
    while (byte := f.read(1)):
        hex.append("0x" + byte.hex())

output = ",".join(hex)
opener = " export const data = Uint8Array.from([";
ender = "]);";
tsCompiledOutput.write(f'{opener}{output}{ender}')
print(f'{opener}{output}{ender}')

# close written typescript file
tsCompiledOutput.close()
