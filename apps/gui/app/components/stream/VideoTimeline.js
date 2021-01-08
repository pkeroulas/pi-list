import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isFunction, throttle } from 'lodash';
import api from 'utils/api';
import Icon from 'components/common/Icon';
import asyncLoader from 'components/asyncLoader';
import { translateC } from 'utils/translation';

const propTypes = {
    pcapID: PropTypes.string.isRequired,
    streamID: PropTypes.string.isRequired,
    frames: PropTypes.arrayOf(PropTypes.object).isRequired,
    onFrameChange: PropTypes.func,
    initFrameIndex: PropTypes.number,
};

const defaultProps = {
    onFrameChange: null,
    initFrameIndex: -1
};

const VideoTimeline = (props) => {
    const [frameIndex, setFrameIndex] = useState(props.initFrameIndex);
    const lastFrameIndex = props.frames.length - 1;
    const streamPercentage = ((frameIndex) / (props.frames.length - 1)) * 100;

    // determine visible frames windows
    let framesWindow = [];
    const VISIBLE_WINDOW_SIZE = 6;
    const WINDOW_SIZE = 8;
    if (frameIndex >= 0 && frameIndex < VISIBLE_WINDOW_SIZE - 3) { // beginning
        framesWindow = props.frames
            .slice(0, WINDOW_SIZE)
            .map((frame, index) => {
                return Object.assign({}, frame, {
                    hide: (index === VISIBLE_WINDOW_SIZE || index === VISIBLE_WINDOW_SIZE + 1),
                    index: index,
                });
            });
    } else if (frameIndex > (lastFrameIndex - (VISIBLE_WINDOW_SIZE - 2)) && frameIndex <= lastFrameIndex) { // end
        framesWindow = props.frames
            .slice((lastFrameIndex - 1) - VISIBLE_WINDOW_SIZE, lastFrameIndex + 1)
            .map((frame, index) => {
                return Object.assign({}, frame, {
                    hide: (index === 0 || index === 1),
                    index: lastFrameIndex - 1 + index,
                });
            });

    } else { // middle
        framesWindow = props.frames
            .slice(frameIndex - 3, frameIndex + (VISIBLE_WINDOW_SIZE - 1))
            .map((frame, index) => {
                return Object.assign({}, frame, {
                    hide: (index === 0 || index === VISIBLE_WINDOW_SIZE + 1),
                    index: frameIndex - 3 + index,
                });
            });
    }

    useEffect(() => {
        if (isFunction(props.onFrameChange)) {
            const currentFrame = props.frames[frameIndex];
            props.onFrameChange(frameIndex, currentFrame);
        }
    }, [frameIndex]);

/*
    //in constructor: this.onNavigationKeyDown = this.onNavigationKeyDown.bind(this);
    componentDidMount() {
        document.addEventListener('keydown', throttle(onNavigationKeyDown, 180));
        getFrameWindow(props.initFrameIndex, props.frames.length);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', onNavigationKeyDown);
    }
    onNavigationKeyDown(event) {
        if (event.key === 'ArrowLeft' && frameIndex > 0) {
            setFrameIndex(frameIndex - 1);
        } else if (event.key === 'ArrowRight' && frameIndex < lastFrameIndex) {
            setFrameIndex(frameIndex + 1);
        }
    }
*/

    const onImageClick = (event) => {
        setFrameIndex(parseInt(event.target.alt));
    }

    const onProgressClick = (event) => {
        event.persist();
        const pointerX = event.clientX;
        const barRect = document.getElementById('progress').getBoundingClientRect();
        const pos = (pointerX - barRect.x) / barRect.width; // [0..1]
        setFrameIndex(parseInt(pos * lastFrameIndex));
    }


    if (props.frames.length > 0) {
        return (
            <div className="lst-stream-timeline">
                <div className="row">
                    {framesWindow.map((frame) => {
                        const { pcapID, streamID } = props;
                        const imageClassName = classNames(
                            'col-xs-2',
                            'lst-stream-timeline-image',
                            {
                                'lst-hide': frame.hide,
                                selected: frame.timestamp === props.frames[frameIndex].timestamp
                            }
                        );
                        const frameImageURL = api.getThumbnailFromStream(pcapID, streamID, frame.timestamp);

                        return (
                            <div className={imageClassName} key={frame.timestamp}>
                                <img
                                    alt={`${frame.index}`}
                                    src={frameImageURL}
                                    onClick={onImageClick}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="lst-timeline-bar row" id='progress' onClick={onProgressClick}>
                    <div className="lst-timeline-progress" style={{ width: `${streamPercentage}%` }} />
                </div>
            </div>
        );
    } else {
        return (
            <div className="col-xs-12">
                <h2 className="lst-text-dark-grey lst-text-center">
                    <Icon className="lst-center-icon" value="error outline" />
                    <span>{translateC('stream.no_frames')}</span>
                </h2>
            </div>
        );
    }
}

VideoTimeline.propTypes = propTypes;
VideoTimeline.defaultProps = defaultProps;

export default VideoTimeline;
