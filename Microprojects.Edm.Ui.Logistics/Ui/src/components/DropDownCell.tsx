import { type DataItem, Dictionary, type UUID } from '@logistics/data/types'
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns'
import type { DropDownListChangeEvent } from '@progress/kendo-react-dropdowns/dist/npm/DropDownList/DropDownListProps'
import { Input, type InputChangeEvent } from '@progress/kendo-react-inputs'
import type React from 'react'
import { useContext } from 'react'
import { ParentContext } from './ParentContext'

type EditableCellProps = {
    inEdit?: boolean
}

type DropDownCompProps = {
    onChange: Function
    field: string
    dataItem: any
    dataItemKey?: string
    data: any[]
    value: any
    textField?: string
}

export const DropDownComp = (props: DropDownCompProps) => {
    const handleChange = (e: DropDownListChangeEvent): void => {
        const selected = e.target.value
        const nextValue =
            props.dataItemKey && selected && typeof selected === 'object'
                ? selected[props.dataItemKey]
                : selected
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: nextValue,
        })
    }
    const list = props.data || []
    const value = props.dataItemKey
        ? list.find(
              (c) =>
                  c &&
                  typeof c === 'object' &&
                  c[props.dataItemKey as string] === props.value,
          ) || null
        : (props.value ?? null)
    return (
        <DropDownList
            {...props}
            data={list}
            onChange={handleChange}
            value={value}
        />
    )
}

type MultiSelectCompProps = {
    onChange: Function
    field: string
    dataItem: any
    data: string[]
    value: string[] | null | undefined
}

export const MultiSelectComp = (props: MultiSelectCompProps) => {
    const handleChange = (e: any) => {
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: e.target.value || [],
        })
    }

    return (
        <MultiSelect
            data={props.data || []}
            value={props.value || []}
            onChange={handleChange}
        />
    )
}

interface DropDownCellProps extends EditableCellProps {
    getData: Function
    onClick: Function
    onChange: Function
    dataItem: any
    field: string
    id: string
    text: string
    fieldName?: string
    fieldId: string
    editable?: boolean
    template?: string
}

export const DropDownCell = ({
    getData,
    id,
    text,
    fieldName,
    fieldId,
    onClick,
    editable = true,
    ...props
}: DropDownCellProps) => {
    const context = useContext(ParentContext)
    const handleChange = (e: DropDownListChangeEvent): void => {
        const event = {
            dataItem: props.dataItem, //e.value,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: e.target.value[id],
        }
        props.onChange(event)
    }
    let content: React.ReactNode
    const { dataItem, field } = props
    const dataValue = dataItem[field]
    const list = (getData && getData()) || []
    const value = list.find((c: any) => c[id] === dataValue)
    if (getData && dataItem.inEdit && editable) {
        content = (
            <DropDownList
                onChange={handleChange}
                value={value}
                data={list}
                textField={text}
                dataItemKey={id}
            />
        )
    } else if (onClick) {
        const valueName = fieldName
            ? dataItem[fieldName]
            : (value && value[text]) || dataItem[fieldId]
        const valueId = fieldId
            ? dataItem[fieldId]
            : value
              ? value[id]
              : dataItem[field]
        content = (
            <a
                style={{ color: 'var(--anchor-color)' }}
                type="button"
                onClick={() => onClick(valueId, context.itemUpdate)}
            >
                {valueName}
            </a>
        )
    } else {
        const valueName = fieldName
            ? dataItem[fieldName]
            : (value && value[text]) || ''
        content = <span>{valueName}</span>
    }

    return <td style={{ whiteSpace: 'nowrap' }}>{content}</td>
}

interface LinkTextCellProps extends EditableCellProps {
    getData: Function
    onClick: Function
    onChange: Function
    dataItem: EditableCellProps & any
    inEditField: string
    field: string
    id: string
    text: string
    fieldName: string
    fieldId: string
    editable: boolean
    template: string
}

export const LinkTextCell = ({
    fieldId,
    onClick,
    template,
    editable = true,
    ...props
}: LinkTextCellProps) => {
    const context = useContext(ParentContext)
    const handleChange = (e: InputChangeEvent): void => {
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            value: e.target.value,
        })
    }
    let content: React.ReactElement
    const { dataItem, field } = props
    const value = template || dataItem[field]
    if (dataItem.inEdit) {
        content = editable ? (
            <Input onChange={handleChange} value={value} />
        ) : (
            <></>
        )
    } else {
        const id = dataItem[fieldId || 'id']
        content = (
            <a
                type="button"
                style={{ color: 'var(--anchor-color)' }}
                onClick={() => onClick(id, context.itemUpdate)}
            >
                {value}
            </a>
        )
    }

    return <td style={{ whiteSpace: 'nowrap' }}>{content}</td>
}

interface DetailLinkTextProps {
    onClick: (id: UUID, onUpdate: (dataItem: DataItem) => void) => void
    id: UUID
    text: string
}

export const DetailLinkText = ({ onClick, id, text }: DetailLinkTextProps) => {
    const context = useContext(ParentContext)
    return (
        <span
            style={{ color: 'var(--anchor-color)', cursor: 'pointer' }}
            onClick={() => onClick(id, context.itemUpdate)}
        >
            {text}
        </span>
    )
}
