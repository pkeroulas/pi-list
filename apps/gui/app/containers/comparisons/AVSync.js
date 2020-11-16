import React, { useState } from 'react';
import api from 'utils/api';
import asyncLoader from 'components/asyncLoader';
import StreamTimeline from '../../components/stream/StreamTimeline'
import Panel from '../../components/common/Panel';
import InfoPane from '../streamPage/components/InfoPane';

const getVideo = (config) => {
    return config.main.media_type === 'video'? config.main : config.reference;
}

const getAudio = (config) => {
    return config.main.media_type === 'audio'? config.main : config.reference;
}

const AVSync = (props) => {
    console.log(props)
    const video = getVideo(props.config)
    const toto = props.result.toto;
    const delay = props.result.delay;

    const [frame, setFrame] = useState({timestamp: 0, first_packet_ts: 0});

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
    ]

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
    }
});
