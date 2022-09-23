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
opener = "const stringTable: { [key: string]: string } = {";
ender = "};"
newOutput = open('typescript-parsable.txt', 'w+')
newOutput.write(f'{opener}{output}{ender}')
newOutput.write('\n')
newOutput.write('\n')
print(f'{opener}{output}{ender}')

hex = []
with open("Output.yarnc", "rb") as f:
    while (byte := f.read(1)):
        hex.append("0x" + byte.hex())

output = ",".join(hex)
opener = "const data = Uint8Array.from([";
ender = "]);";
newOutput.write(f'{opener}{output}{ender}')
print(f'{opener}{output}{ender}')

newOutput.close()
