import {useContext} from 'react';
import {ParentContext} from '../master/ParentContext';

interface DetailLinkTextProps {
    onClick: (id: string, onUpdate: (item?: any) => void) => void;
    id: string;
    text: string;
}

export const DetailLinkText = ({onClick, id, text}: DetailLinkTextProps) => {
    const context = useContext(ParentContext);
    return (
        <span
            style={{color: 'var(--accent)', cursor: 'pointer'}}
            onClick={() => onClick(id, context.itemUpdate)}
        >
            {text}
        </span>
    );
};
