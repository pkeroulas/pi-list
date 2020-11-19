const logger = require('../util/logger');

const createComparator = async (config) => {
    return {
        delay: 0,
        audiopos: 0,
        frame: 0,
    };
}


module.exports = {
    createComparator,
};
