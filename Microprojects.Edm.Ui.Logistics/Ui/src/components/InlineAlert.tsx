import {Alert} from "reactstrap";
import React, {useEffect, useState} from "react";

export type AlertState = {
    message: string
    status?: 'warning' | 'danger' | undefined
}

type InlineAlertProps = {
    id?: any;
    state?: AlertState
    onClose?: () => void
}
export const InlineAlert = (props: InlineAlertProps) => {
    const closeAlert = () => {
        props.onClose?.();
    }
    return (
        props.state &&
        <div style={{position: 'absolute', top: 0, right: 0, zIndex: 1}}>
            <style>
                {`
                    .alertCloseBtn {
                        top: 0.5rem !important;
                        right: 0.5rem !important;
                    } 
                `}
            </style>
            <Alert id={props.id} color={props.state.status} fade={true} toggle={closeAlert} closeClassName='alertCloseBtn'>
                {props.state.message}
            </Alert>
        </div>
    )
}