import { Button } from '@progress/kendo-react-buttons';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useGet } from './hooks/hooks';
import { Field, Form, FormElement } from '@progress/kendo-react-form';
import axios from 'axios';
import { Countdown } from './Countdown';
import { useOutletContext } from 'react-router-dom';

export function Profile({ steps }) {
    const { operationId, apiBase } = useOutletContext();
    const [[profile]] = useGet(`${apiBase}/api/operator/${operationId}/profile`, []);
    return (
        <div style={{ padding: '0.5rem', fontWeight: 'normal', fontSize: '1rem', color: 'gray' }}>
            {profile && profile.map((s, i) =>
                <p key={i} style={{ fontWeight: steps.some(c => c === s.command) ? 'bold' : 'normal' }}>{i + 1}). {s.command}: {s.description}</p>
            )}
        </div>
    );
}