const productionJson = require('../src/assets/production.json');
const developmentJson = require('../src/assets/development.json');
const loginJson = require('../src/assets/login.json');
const defaultJson = require('../src/assets/default.json');
const packageJson = require('../package.json');
const fs = require('fs');

const main = () => {
    productionJson.Version = packageJson.version;
    developmentJson.Version = packageJson.version;
    loginJson.Version = packageJson.version;
    packageJson.Version = packageJson.version;

    fs.truncate('./src/assets/production.json', (err) => {
        if (err) {
            console.warn('Unable to open production.json', err);
            return;
        }
        fs.writeFile('./src/assets/production.json', JSON.stringify(Object.assign(productionJson)), (err) => {
            if (err) {
                console.warn('Version not added in production.json', err);
                return;
            }
        });
    });

    fs.truncate('./src/assets/development.json', (err) => {
        if (err) {
            console.warn('Unable to open development.json', err);
            return;
        }
        fs.writeFile('./src/assets/development.json', JSON.stringify(Object.assign(developmentJson)), (err) => {
            if (err) {
                console.warn('Version not added in development.json', err);
                return;
            }
        });
    });

    fs.truncate('./src/assets/login.json', (err) => {
        if (err) {
            console.warn('Unable to open login.json', err);
            return;
        }
        fs.writeFile('./src/assets/login.json', JSON.stringify(Object.assign(loginJson)), (err) => {
            if (err) {
                console.warn('Version not added in login.json', err);
                return;
            }
        });
    });

    fs.truncate('./src/assets/default.json', (err) => {
        if (err) {
            console.warn('Unable to open default.json', err);
            return;
        }
        fs.writeFile('./src/assets/default.json', JSON.stringify(Object.assign(defaultJson)), (err) => {
            if (err) {
                console.warn('Version not added in default.json', err);
                return;
            }
        });
    });
};

main();
