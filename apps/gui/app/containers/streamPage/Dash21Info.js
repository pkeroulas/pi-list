import React, { Fragment } from 'react';
import Icon from 'components/common/Icon';
import { renderInformationList } from 'containers/streamPage/utils';
import { translate } from 'utils/translation';

const getLowestFromHistogram = (hist) => {
    if (!hist || hist.length === 0) return 0;
    return hist[0][0];
};

const getHighestFromHistogram = (hist) => {
    if (!hist || hist.length === 0) return 0;
    return hist[hist.length - 1][0];
};

const VideoStatistics = (props) => {

    const compliance = props.compliance;
    const cinstCompliance = props.cinst.compliance;
    const vrxCompliance = props.vrx.compliance;

    const cmin = getLowestFromHistogram(props.cinst.histogram);
    const cpeak = getHighestFromHistogram(props.cinst.histogram);
    const vrxmin = getLowestFromHistogram(props.vrx.histogram);
    const vrxpeak = getHighestFromHistogram(props.vrx.histogram);

    return (
        <Fragment>
            <h2>
                <Icon value="assignment" />
                <span>ST2110-21</span>
            </h2>
            <hr />
            {renderInformationList([
                {
                    key: translate('stream.compliance'),
                    value: `${compliance} (C: ${cinstCompliance}, Vrx: ${vrxCompliance})`
                },
                {
                    key: 'Cinst',
                    value: `${cmin} .. ${cpeak}`
                },
                {
                    key: 'Vrx',
                    value: `${vrxmin} .. ${vrxpeak}`
                },
            ])}
        </Fragment>
    );
};

export default VideoStatistics;