import data from "./dev-data";

// When we're doing a development build and the Yarn data is available at build
// time, import that data and set it as a global property on window. The data
// will then be available at startup.

declare global {
    interface Window {
        yarnData: typeof data;
    }
}

window.yarnData = data;
