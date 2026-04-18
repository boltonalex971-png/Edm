import { UUID } from '@logistics/data/types'
import { ComboBox, type ComboBoxProps } from '@progress/kendo-react-dropdowns'
import type * as React from 'react'
import { useGet } from '../hooks/hooks'

type LinkableComboBoxProps = ComboBoxProps & React.RefAttributes<any> & {}
export const LinkableComboBox = (props: LinkableComboBoxProps) => {
    const value =
        props.value && typeof props.value === 'string'
            ? props.data?.find((d) => d['id'] === props.value)
            : props.value
    return (
        <ComboBox
            {...props}
            dataItemKey={'id'}
            textField={'name'}
            value={value}
        />
    )
}
