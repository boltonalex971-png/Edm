import { Checkbox } from '@progress/kendo-react-inputs'

interface CheckboxCellProps {
    onChange: Function
    dataItem: any
    field: string
    inEdit?: boolean
    editable?: boolean
}

export const CheckboxCell = ({
    editable = true,
    ...props
}: CheckboxCellProps) => {
    const { dataItem, field } = props
    const value = !!dataItem[field]
    if (dataItem.inEdit && editable) {
        return (
            <td>
                <Checkbox
                    value={value}
                    onChange={(e) =>
                        props.onChange({
                            dataItem,
                            field,
                            syntheticEvent: e.syntheticEvent,
                            value: e.value,
                        })
                    }
                />
            </td>
        )
    }
    return <td style={{ textAlign: 'center' }}>{value ? '✓' : ''}</td>
}
