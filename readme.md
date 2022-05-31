# TypeScript Yarn Spinner

This is a work-in-progress TypeScript VM and runner of compiled yarn files.
The intent for this is to allow for easily embedding Yarn narrative into a website for ease of testing and sharing during your games development.
Idealised flow will be something like the following:

1. Write story
2. Use [`ysc`](https://github.com/YarnSpinnerTool/YarnSpinner-Console) or the [Visual Studio Extension](https://github.com/YarnSpinnerTool/VSCodeExtension) to compile the yarn into a single HTML file
3. Email/upload/etc your story for people to look at

The goal of this project, at least initially, is *not* to make a JS version of Yarn Spinner, but to make something to more easily share stories for feedback and testing.
As such the entire design philosophy at this stage is around making a single JS and HTML file representing your Yarn to be embedded into a website, not a tool for making a web narrative game.

## Using This

This is not ready for use, **this will not work**, please don't try.
If this does work this is a bug and shouldn't be considered normal behaviour.

There is a teensy example (`index.html`) inside of `dist` that shows off the bare minimum behaviour.
The yarn that goes along with this is as follows:

```
title: Start
---
<<declare $string = "5">>
line with some substitution in it {number($string)}, how cool

-> option A
    line underneath option A
-> option B

<<jump Second>>
===

title: Second
---
this is the only line in the second node!
===
```

## Building and Modifying This

To build this you will need the following tools:

- `NPM`
- `TypeScript`
- `Protobuf`
- [`Protobuf for TypeScript`](https://github.com/timostamm/protobuf-ts)
- `Webpack`
- `Jest`
- [`Typescript Jest`](https://github.com/kulshekhar/ts-jest)
- `Python`

Assuming you somehow manage to survive the labyrinthian nightmare of installing these tools you are still quite some steps away from being able to do anything useful.

If you wanted to replace the story you would need to do the following:

1. Using ysc compile your yarn into a yarnc and csv file: `ysc compile your_yarn.yarn`
2. Using `munger.py` create a TypeScript text embeddable version of your compiled story: `python munger.py`
3. Replace the `stringTable` and `data` variables inside `index.ts` with those created by `munger.py`
5. Compile the TypeScript and run webpack to munge everything up into a single js file we can use: `npm run build`
6. Open `index.html` in your browser and "enjoy"

### Build the Protobuf file

In this repo is a pre-made `yarn_spinner.ts` TypeScript version of the [Yarn Spinner protobuf definition](https://github.com/YarnSpinnerTool/YarnSpinner/blob/main/YarnSpinner/yarn_spinner.proto).
If you wanted to build this yourself you'd need to make it via the following command: `npx protoc --ts_out . --proto_path folder_you_put_the_proto folder_you_put_the_proto/yarn_spinner.proto`

### Testing

We use Jest for testing.
The tests run through the testplans and pre-compiled yarn inside of `testdata`.
These are the same tests (not all work currently) the C# version of Yarn Spinner uses.
Because this has no compiler these files needed for this were created using the `munger.sh` bash script inside the `testdata` folder.

To run the tests yourself use the following command: `npm test` a great many of them don't work yet, such is life.
The testing infrastructure is all contained withing `index.test.ts`

## License

See the license file for information on the license of this.
