import React, {useState} from 'react';
import {Box, Button} from '@mui/material';
import {SmartScroll, SmartScrollContent} from '@microprojects/tools';

export interface SearchAction {
    /** Stable identifier — used to track which action is active. */
    key: string;
    /** Rail button label. */
    label: string;
    /** Optional leading icon (typically a `@mui/icons-material` component
     *  or any ReactNode). */
    icon?: React.ReactNode;
    /** Right-pane content rendered while this action is active. May be `null`
     *  for actions that only fire `onClick` and don't switch the pane. */
    panel?: React.ReactNode;
    /** Optional side-effect fired when the rail button is clicked
     *  (e.g. trigger an external workflow). The pane still flips to this
     *  action unless `panel` is `null`. */
    onClick?: () => void;
    /** Disable the rail button. */
    disabled?: boolean;
}

export interface SearchProps {
    /** Rail actions, top-to-bottom. */
    actions: SearchAction[];
    /** Initially-active action key. Defaults to the first action's key. */
    defaultKey?: string;
}

/** Two-column page-layouting primitive: a left rail of vertical action
 *  buttons and a right pane that mirrors the active action's `panel`.
 *  Lifted from Logistics's `components/Search.tsx`; the rail content is
 *  now consumer-driven (no hard-coded "Search / Create / Get from
 *  accounting system" buttons). Uses `SmartScroll` for sticky scrolling. */
export function Search({actions, defaultKey}: SearchProps) {
    const initialKey = defaultKey ?? actions[0]?.key;
    const [activeKey, setActiveKey] = useState<string | undefined>(initialKey);
    const active = actions.find((a) => a.key === activeKey);

    return (
        <SmartScroll
            offsetTop={10}
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 20,
                width: '100%',
                minWidth: 0,
            }}
        >
            <SmartScrollContent
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    paddingTop: 12,
                }}
            >
                {actions.map((action) => (
                    <Button
                        key={action.key}
                        type="button"
                        variant={action.key === activeKey ? 'contained' : 'text'}
                        color={action.key === activeKey ? 'primary' : 'inherit'}
                        size="small"
                        startIcon={action.icon}
                        disabled={action.disabled}
                        onClick={() => {
                            action.onClick?.();
                            if (action.panel !== null) setActiveKey(action.key);
                        }}
                        sx={{justifyContent: 'flex-start', textTransform: 'none', minWidth: 0}}
                    >
                        {action.label}
                    </Button>
                ))}
            </SmartScrollContent>
            <SmartScrollContent style={{flex: 5, minWidth: 0, marginLeft: '1rem'}}>
                {active?.panel}
                {/* Reserve scroll headroom so the active panel doesn't jerk
                    when collapsing tall sub-cards near the viewport bottom. */}
                <Box sx={{height: '40vh'}} />
            </SmartScrollContent>
        </SmartScroll>
    );
}
