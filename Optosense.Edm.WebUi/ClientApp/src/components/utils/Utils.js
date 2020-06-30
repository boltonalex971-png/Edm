import React from 'react';
import PropTypes from 'prop-types';

export function Loading() {
    return (
        <div className="k-loading-mask" style={{ width: '100%', textAlign: 'center' }}>
            <span className="k-loading-text">Loading...</span>
            <div className="k-loading-image"></div>
            <div className="k-loading-color"></div>
        </div>
    );
}

DetailStub.propTypes = {
    message: PropTypes.string.isRequired
}

export function DetailStub({ message }) {
    return (
        <div style={{ width: '100%', textAlign: 'center' }}>
            {message}
        </div>
    );
}

export function dateToSpan(dateToConvert) {
    const dividerToSeconds = 1000;
    const now = new Date();
    const date = new Date(dateToConvert);
    const span = Math.abs(now - date);
    var days = Math.floor(span / dividerToSeconds / 60 / 60 / 24);
    var hours = Math.floor(span / dividerToSeconds / 60 / 60 % 24);
    var minutes = Math.floor(span / dividerToSeconds / 60 % 60);
    var seconds = Math.floor(span / dividerToSeconds % 60);
    var sDays = days ? days + 'd ' : '';
    var sHours = hours || days && (minutes || seconds) ? hours + 'h ' : "";
    var sMinutes = minutes || (days || hours) && seconds ? minutes + 'm ' : "";
    var sSeconds = seconds ? seconds + 's' : "";

    return sDays + sHours + sMinutes + sSeconds;
}

export function dateToHumanSpan(dateToConvert) {
    const dividerToSeconds = 1000;
    const now = new Date();
    const date = new Date(dateToConvert);
    const span = Math.abs(now - date);
    const days = Math.floor(span / dividerToSeconds / 60 / 60 / 24);
    const hours = Math.floor(span / dividerToSeconds / 60 / 60 % 24);
    const minutes = Math.floor(span / dividerToSeconds / 60 % 60);
    const seconds = Math.floor(span / dividerToSeconds % 60);
    const result = days && (days == 1 ? 'yesterday' : `${days} days`) ||
        hours && (hours == 1 ? 'an hour' : `${hours} hours`) ||
        minutes && (minutes == 1 ? 'a minute' : `${minutes} minutes`) ||
        seconds && (seconds == 1 ? 'a second' : `${seconds} seconds`);

    return result;
}
