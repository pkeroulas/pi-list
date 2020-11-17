import React, { useState, useEffect } from 'react';
import api from 'utils/api';
import asyncLoader from 'components/asyncLoader';
import StreamTimeline from 'components/stream/StreamTimeline'
import Panel from 'components/common/Panel';
import InfoPane from 'containers/streamPage/components/InfoPane';
import AudioPlayer from 'components/audio/AudioPlayer';
import websocket from 'utils/websocket';
import websocketEventsEnum from 'enums/websocketEventsEnum';
import notifications from 'utils/notifications';

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
    const toto = props.result.toto;
    const delay = props.result.delay;
    //console.log( props.audioInfo.statistics.first_packet_ts )

    const [frame, setFrame] = useState({timestamp: 0, first_packet_ts: 0});
    const [mp3Url, setMp3Url] = useState(api.downloadMp3Url(audio.pcap, audio.stream)); // harcoded 2 channels

    const summary = [
        {
            labelTag: 'comparison.result.cross_correlation_max',
            value:  toto,
            units: '',
        },
        {
            labelTag: 'first_packet_ts',
            value:  frame.first_packet_ts,
            units: 'ns',
        },
        {
            labelTag: 'timestamp',
            value:  frame.timestamp,
            units: '',
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
                    onFrameChange={(frame) => setFrame(frame)}
                />
                <AudioPlayer
                    src={mp3Url}
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
            //api.renderMp3(audio.pcap, audio.stream, "0,1")
            return api.getStreamInformation(audio.pcap, audio.stream);
        },
    }
});
