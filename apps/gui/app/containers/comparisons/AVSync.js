import React, { useState, useEffect, useReducer } from 'react';
import api from 'utils/api';
import asyncLoader from 'components/asyncLoader';
import StreamTimeline from 'components/stream/StreamTimeline'
import Panel from 'components/common/Panel';
import InfoPane from 'containers/streamPage/components/InfoPane';
import AudioPlayer from 'components/audio/AudioPlayer';
import websocket from 'utils/websocket';
import websocketEventsEnum from 'enums/websocketEventsEnum';
import notifications from 'utils/notifications';

const nsPerSec = 1000000000;

const getVideo = (config) => {
    return config.main.media_type === 'video'? config.main : config.reference;
}

const getAudio = (config) => {
    return config.main.media_type === 'audio'? config.main : config.reference;
}

const AVSync = (props) => {
    console.log(props)
    const video = getVideo(props.config);
    const audio = getAudio(props.config);
    const [mp3Url, setMp3Url] = useState(api.downloadMp3Url(audio.pcap, audio.stream)); // harcoded 2 channels
    const [videoCursor, setVideoCursor] = useState(props.result.videoCursor);
    const [audioCursor, setAudioCursor] = useState(props.result.audioCursor);
    const [delay, setDelay] = useState(props.result.delay.actual);

    const summary = [
        {
            labelTag: 'headings.video',
            value:  videoCursor.ts.toFixed(6),
            units: 's',
        },
        {
            labelTag: 'headings.audio',
            value:  audioCursor.ts.toFixed(6),
            units: 's',
        },
        {
            labelTag: 'comparison.result.AVDelay',
            value:  (delay / 1000).toFixed(3),
            units: 'ms',
        },
    ];

    const onMp3Rendered = () => setMp3Url(api.downloadMp3Url(audio.pcap, audio.stream));
    const onMp3Failed = () => setMp3Url("");

    useEffect(() => {
        websocket.on(websocketEventsEnum.MEDIA.MP3_FILE_RENDERED, onMp3Rendered);
        websocket.on(websocketEventsEnum.MEDIA.MP3_FILE_FAILED, onMp3Failed);
        return () =>  {
            websocket.off(websocketEventsEnum.MEDIA.MP3_FILE_RENDERED, onMp3Rendered);
            websocket.off(websocketEventsEnum.MEDIA.MP3_FILE_FAILED, onMp3Failed);
        }
    }, []);

    const onFrameChange = (index, frame) => {
        // frame Ts should be the middle point between 1st and last pks ts
        console.log(`frame index: ${index}`)
        setVideoCursor({
            ts: (frame.first_packet_ts + frame.last_packet_ts) / nsPerSec / 2,
            position: index,
        });
    }

    const onAudioCursorChanged = (mp3Duration, mp3CurrentTime) => {
        console.log(`audio ts: ${mp3CurrentTime}`)
        // cursor time 2 absolute time
        const rawDuration = (props.audioInfo.statistics.last_packet_ts - props.audioInfo.statistics.first_packet_ts) / nsPerSec + props.audioInfo.media_specific.packet_time / 1000;
        // waveform is mp3 file which is longer than raw
        const mp3RawError = mp3Duration - rawDuration;
        const absTime = mp3CurrentTime - mp3RawError + (props.audioInfo.statistics.first_packet_ts / nsPerSec);
        /*
        console.log(`mp3Duration - rawDuration = ${mp3Duration} - ${rawDuration} = ${mp3RawError}`);
        console.log(`mp3CurrentTime: ${mp3CurrentTime}`);
        console.log(`absTime: ${absTime}`);
        */

        setAudioCursor({
            ts: absTime,
            position: mp3CurrentTime / mp3Duration,
        });
    }

    useEffect(() => {
        const diff = (audioCursor.ts - videoCursor.ts) * 1000000; // convert s to us
        const result = {
            delay: {actual: diff},
            audioCursor: audioCursor,
            videoCursor: videoCursor,
            transparency: false,
        };
        if (delay === diff) {
            return;
        }

        setDelay(diff);
        console.log(`Res:`);
        console.log(result);

        api.postComparison(props.id, {
            id: props.id,
            _id: props._id,
            name: props.name,
            date: props.date,
            type: props.type,
            config: props.config,
            result: result,
        });
    }, [audioCursor, videoCursor]);

    return (
        <div>
            <InfoPane
                icon='alarm'
                headingTag='headings.AVSync'
                values={summary}
            />
            <Panel className="lst-stream-info-tab">
                <StreamTimeline
                    pcapID={video.pcap}
                    streamID={video.stream}
                    frames={props.frames}
                    initFrame={props.result.videoCursor.position}
                    onFrameChange={onFrameChange}
                />
                <AudioPlayer
                    src={mp3Url}
                    timeline={true}
                    cursorInitPos={props.result.audioCursor.position}
                    onCursorChanged={onAudioCursorChanged}
                />
            </Panel>
        </div>
    );
};

export default asyncLoader(AVSync, {
    asyncRequests: {
        frames: props => {
            const video = getVideo(props.config);
            return api.getFramesFromStream(video.pcap, video.stream);
        },
        audioInfo: props => {
            const audio = getAudio(props.config)
            return api.getStreamInformation(audio.pcap, audio.stream);
        },
    }
});
