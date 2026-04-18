import { Field } from '@progress/kendo-react-form'
import { Input } from '@progress/kendo-react-inputs'
import React, { type MouseEventHandler } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import type { TreeNode } from '../../data/types'
import { useGet } from '../../hooks/hooks'
import type { RootState } from '../../store'
import { MultiSelectComp } from '../DropDownCell'
import { Detail, EMPTY_GUID, Editor, Info } from '../MasterDetail'

type FolderProps = {
    onChange: () => void
    onClose: MouseEventHandler
    path: string
    api: string
    type: string
}

function formatGroups(groups: unknown): string | null {
    if (groups == null) {
        return null
    }
    if (Array.isArray(groups)) {
        const parts = groups
            .map((g) => {
                if (typeof g === 'string') {
                    return g
                }
                if (
                    g &&
                    typeof g === 'object' &&
                    'name' in (g as any) &&
                    typeof (g as any).name === 'string'
                ) {
                    return (g as any).name
                }
                return null
            })
            .filter((x): x is string => Boolean(x && x.trim()))
        return parts.length ? parts.join(', ') : null
    }
    if (typeof groups === 'string') {
        return groups.trim() || null
    }
    return String(groups)
}

export function Folder(props: FolderProps) {
    const user = useSelector((state: RootState) => state.user)
    const { id } = useParams()
    let [[data, setData], loading, error] = useGet<TreeNode>(
        `${props.api}/${id}`,
        [id],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '', url: '' } as TreeNode
    }
    const groupsText = formatGroups((data as any)?.groups)
    return (
        <Detail
            {...props}
            copyable={false}
            id={id}
            icon={<span className="k-icon k-i-folder" title="Folder" />}
            loading={loading}
            error={error}
            data={data}
            card={
                <Info
                    {...props}
                    data={data}
                    content={
                        <div>
                            <p>{`${data.name}`}</p>
                            <small>{`${data.description}`}</small>
                            <div style={{ marginTop: 8 }}>
                                <small>
                                    <b>Groups:</b> {groupsText || 'All'}
                                </small>
                            </div>
                        </div>
                    }
                />
            }
            editor={
                <Editor
                    {...props}
                    type={props.type}
                    data={data}
                    setData={setData}
                    content={
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>
                                Edit folder
                            </legend>
                            <div className="mb-3">
                                <Field
                                    name={'name'}
                                    component={Input}
                                    label={'Name'}
                                />
                            </div>
                            <div className="mb-3">
                                <Field
                                    name={'description'}
                                    component={Input}
                                    label={'Description'}
                                />
                            </div>
                            <div className="mb-3" style={{ width: '400px' }}>
                                <Field
                                    name={'groups'}
                                    label={'Groups'}
                                    component={(compProps) => (
                                        <MultiSelectComp
                                            {...compProps}
                                            data={user?.groups || []}
                                        />
                                    )}
                                />
                            </div>
                        </fieldset>
                    }
                />
            }
        />
    )
}
