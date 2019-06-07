import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/common/Button';
import { WS_SERVER_URL } from '../../utils/api';
import Actions from './Actions';
import { StateContext } from './Context';

const PcapToolbar = props => {

    const [state, dispatch] = useContext(StateContext);

    const deleteButton = (
        <Button
            icon="delete"
            type="danger"
            link
            disabled={props.selectedItems === null || props.selectedItems.length === 0}
            onClick={() => dispatch({ type: Actions.requestDelete, data: { ids: props.selectedItems } })}
        />
    );

    const selectBefore = (
        <Button
            icon="navigate_before"
            type="info"
            link
            disabled={props.selectedItems === null || props.selectedItems.length !== 1}
            onClick={() => dispatch({ type: Actions.selectBefore, data: { id: props.selectedItems[0] } })}
        />
    );

    const selectAfter = (
        <Button
            icon="navigate_next"
            type="info"
            link
            disabled={props.selectedItems === null || props.selectedItems.length !== 1}
            onClick={() => dispatch({ type: Actions.selectAfter, data: { id: props.selectedItems[0] } })}
        />
    );

    const downloadPcap = (
        <Button
            className="lst-header-button"
            label="PCAP"
            type="info"
            link
            icon="file_download"
            disabled={props.selectedItems === null || props.selectedItems.length !== 1}
            onClick={() => dispatch({ type: Actions.downloadSelectedPcap })}
        />
    );

    const downloadSdp = (
        <Button
            className="lst-header-button"
            label="SDP"
            type="info"
            link
            icon="file_download"
            disabled={props.selectedItems === null || props.selectedItems.length !== 1}
            onClick={() => dispatch({ type: Actions.downloadSelectedSdp  })}
        />
    );

    const downloadJson = (
        <Button
            className="lst-header-button"
            label="JSON"
            type="info"
            link
            icon="file_download"
            disabled={props.selectedItems === null || props.selectedItems.length !== 1}
            onClick={() => dispatch({ type: Actions.downloadSelectedReport })}
        />
    );

    return (
        <div className="lst-table-actions">
            {deleteButton}
            {selectBefore}
            {selectAfter}
            {downloadPcap}
            {downloadSdp}
            {downloadJson}
        </div>
    );
}

PcapToolbar.propTypes = {
    selectedItems: PropTypes.array,
};

PcapToolbar.defaultProps = {
    selectedItems: [],
};

export default PcapToolbar;