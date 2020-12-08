import React, { useState, useEffect, useReducer } from 'react';
import api from 'utils/api';
import asyncLoader from 'components/asyncLoader';
import VideoTimeline from 'components/stream/VideoTimeline'
import Panel from 'components/common/Panel';
import InfoPane from 'containers/streamPage/components/InfoPane';
import AudioPlayer from 'components/audio/AudioPlayer';
import websocket from 'utils/websocket';
import websocketEventsEnum from 'enums/websocketEventsEnum';

const nsPerSec = 1000000000;

const AVSync = (props) => {
    const video = props.config.main.media_type === 'video'? props.config.main : props.config.reference;
    const audio = props.config.main.media_type === 'audio'? props.config.main : props.config.reference;
    const [mp3Url, setMp3Url] = useState(api.downloadMp3Url(audio.pcap, audio.stream)); // with 2 channels by default
    const [videoCursor, setVideoCursor] = useState(props.result.videoCursor);
    const [audioCursor, setAudioCursor] = useState(props.result.audioCursor);
    const [delay, setDelay] = useState(props.result.delay);
    const comment = `Audio is ${delay.pkt == 0? 'in sync with' : delay.pkt < 0? 'earlier' : 'later'} than video`;

    // TODO: fix labelTags
    const summary = [
        {
            //labelTag: 'comparison.result.video.marker',
            labelTag: 'Video Cursor',
            value: videoCursor.position + 1,
            units: video.scan_type === 'interlaced'? 'fields' : 'frames',
        },
        {
            //labelTag: 'comparison.result.audio.marker',
            labelTag: 'Audio Cursor',
            value: (audioCursor.pktTs - audio.first_packet_ts / nsPerSec).toFixed(3),
            units: 's',
        },
        {
            //labelTag: 'comparison.result.AVDelay',
            labelTag: 'A/V delay (capture time)',
            value:  (delay.pkt / 1000).toFixed(3),
            units: `ms (+/-0.5 ${video.scan_type === 'interlaced'? 'fields' : 'frames'})`,
        },
        {
            //labelTag: 'comparison.result.AVDelay',
            labelTag: 'A/V delay (RTP time)',
            value:  (delay.rtp / 1000).toFixed(3),
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
        if (index < 0) {
            return;
        }

        // frame Ts is middle point between 1st and last pks ts
        const absTime = (frame.first_packet_ts + frame.last_packet_ts) / nsPerSec / 2;

        // compute RTP ts from pkt ts - deltaPktVsRtp
        // deltaPktVsRtp which is logged at the begining of next frame
        const margin_nsec = 1000000;
        api.getDeltaPacketTimeVsRtpTimeRaw(
            video.pcap,
            video.stream,
            frame.last_packet_ts,
            frame.last_packet_ts + margin_nsec)
        .then(e => {
            const deltaPktVsRtp = (e.length > 0)? e[0].value/nsPerSec : NaN; // e in ns
            setVideoCursor({
                pktTs: absTime,
                rtpTs: absTime - deltaPktVsRtp,
                position: index,
            });
        });
    }

    const onAudioCursorChanged = (mp3Duration, mp3CurrentTime) => {
        // cursor time -> absolute time
        const rawDuration = (audio.last_packet_ts - audio.first_packet_ts) / nsPerSec
            + audio.packet_time / 1000;
        // in case mp3 duration defers from raw
        const mp3RawError = mp3Duration - rawDuration;
        const absTime = mp3CurrentTime - mp3RawError
            + (audio.first_packet_ts / nsPerSec);

        // console.log(`mp3Duration - rawDuration = ${mp3Duration} - ${rawDuration} = ${mp3RawError}s`);
        // console.log(`mp3CurrentTime: ${mp3CurrentTime} s`);
        // console.log(`absTime: ${absTime} s`);

        // compute RTP ts from pkt ts - deltaPktVsRtp
        const margin_sec = audio.packet_time / 1000 / 2;
        api.getAudioPktTsVsRtpTs(
            audio.pcap,
            audio.stream,
            (absTime - margin_sec) * 1000000000,
            (absTime + margin_sec) * 1000000000)
        .then(e => {
            const deltaPktVsRtp = (e.length > 0)? e[0].value/1000000 : NaN; // e in us
            setAudioCursor({
                pktTs: absTime,
                rtpTs: absTime - deltaPktVsRtp,
                position: mp3CurrentTime / mp3Duration,
            });
        })
    }

    // compute delay and post to server
    useEffect(() => {
        const result = {
            delay: {
                pkt: (audioCursor.pktTs - videoCursor.pktTs) * 1000000, // convert s to us
                rtp: (audioCursor.rtpTs - videoCursor.rtpTs) * 1000000,
                actual: (audioCursor.pktTs - videoCursor.pktTs) * 1000000, // for comparision summary
            },
            audioCursor: audioCursor,
            videoCursor: videoCursor,
            transparency: false,
        };
        if (delay === result.delay.pkt) {
            return;
        }

        setDelay(result.delay);
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
                comment={comment}
            />
            <Panel className="lst-stream-info-tab">
                <VideoTimeline
                    pcapID={video.pcap}
                    streamID={video.stream}
                    frames={props.frames}
                    initFrameIndex={props.result.videoCursor.position}
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
    //TODO: maybe add timeline with sliders https://reactjsexample.com/a-timeline-range-slider-with-react-js/
};

export default asyncLoader(AVSync, {
    asyncRequests: {
        frames: props => {
            const video = props.config.main.media_type === 'video'? props.config.main : props.config.reference;
            return api.getFramesFromStream(video.pcap, video.stream);
        },
    }
});
