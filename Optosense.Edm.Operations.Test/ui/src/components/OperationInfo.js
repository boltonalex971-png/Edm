import React from "react";
import { Monitor } from "./Monitor";

export const OperationInfo = (props) => {
    return (
        <div style={{ width: "100%" }}>
            <h1>Test Operation</h1>
            <p>
                To start operation please choose appropriate starting date and time and press "Start" button.
                After start the toolbar above must reflect a new status. The operation should run at the scheduled
                time or right away if the chosen time is less than current one.
            </p>
            <p>
                You can get the following info using REST API:
            </p>
            <ul className='flex-column p-2 justify-content-around'>
                <li>
                    <a
                        href={`${props.apiBase}/api/operations/${props.operationId}/status`}
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        {`${props.apiBase}/api/operations/${props.operationId}/status`}
                    </a>
                        &nbsp;Get current operation status
                    </li>
                <li>
                    <a
                        href={`${props.apiBase}/api/operations/${props.operationId}/result`}
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        {`${props.apiBase}/api/operations/${props.operationId}/result`}
                    </a>
                        &nbsp;Get result of completed operation
                    </li>
            </ul>
            <Monitor {...props} />
            <p>
                The operation will be completed automatically. Operation status will be changed in the toolbar
                above.
            </p>
        </div >
    );
};
