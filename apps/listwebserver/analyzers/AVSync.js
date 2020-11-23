const Stream = require('../models/stream');

const nsPerSec = 1000000000;

const getVideo = (config) => {
    return config.main.media_type === 'video'? config.main : config.reference;
}

const getAudio = (config) => {
    return config.main.media_type === 'audio'? config.main : config.reference;
}

const createComparator = async (config) => {
    const video = await Stream.findOne({ id: getVideo(config).stream }).exec();
    const audio = await Stream.findOne({ id: getAudio(config).stream }).exec();
    //
    // init with 1st frame and 1st audio sample
    const videoTs = (video.statistics.first_packet_ts + video.statistics.last_packet_ts) / nsPerSec / 2;
    const audioTs = audio.statistics.first_packet_ts / nsPerSec;

    return {
        delay: {
            actual: audioTs - videoTs
        },
        videoCursor: {
            ts: videoTs,
            position: 0
        },
        audioCursor: {
            ts: audioTs,
            position: 0
        },
        transparency: false, // transparency consistency with A2A and V2V comparison
    };
}


module.exports = {
    createComparator,
};
