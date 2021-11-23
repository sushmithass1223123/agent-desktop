const productionJson = require('../src/assets/production.json');
const developmentJson = require('../src/assets/development.json');
const packageJson = require('../package.json');
const fs = require('fs');

const main = () => {
    productionJson.Version = packageJson.version;
    developmentJson.Version = packageJson.version;
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
};

main();
