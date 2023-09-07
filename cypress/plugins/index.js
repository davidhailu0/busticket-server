const path = require("path");
const fs = require("fs-extra");

module.exports = (on, config) => {

    function getConfigurationByFile(file) {
        const pathToConfigFile = path.resolve("cypress/config", `${file}.json`);
        return fs.readJson(pathToConfigFile);
    }
    const file = config.env.configFile || "staging";
    // if you don't pass any config file, it will read from the staging.json

    return getConfigurationByFile(file);
};