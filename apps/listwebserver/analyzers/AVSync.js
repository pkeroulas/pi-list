const logger = require('../util/logger');

const createComparator = async (config) => {
    return {
        delay: 0,
        videoCursor : {ts: 0, position: 0},
        audioCursor : {ts: 0, position: 0},
    };
}


module.exports = {
    createComparator,
};
