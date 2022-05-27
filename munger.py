import csv

dict = []
with open('Output.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        dict.append(f"\"{row['id']}\":\"{row['text']}\"")

output = ",".join(dict)
opener = "const stringTable: { [key: string]: string } = {";
ender = "};"
print(f'{opener}{output}{ender}')

hex = []
with open("Output.yarnc", "rb") as f:
    while (byte := f.read(1)):
        hex.append("0x" + byte.hex())

output = ",".join(hex)
opener = "const data = Uint8Array.from([";
ender = "]);";
print(f'{opener}{output}{ender}')
