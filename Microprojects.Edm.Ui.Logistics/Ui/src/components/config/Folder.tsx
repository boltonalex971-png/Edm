import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import {
    FolderOutlined as FolderIcon,
    LockOutlined as LockIcon,
    PublicOutlined as PublicIcon,
} from '@mui/icons-material'
import {
    Autocomplete,
    Box,
    Chip,
    TextField,
    Typography,
} from '@mui/material'
import type React from 'react'
import { type MouseEventHandler, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import type { TreeNode } from '../../data/types'
import { useEntityToken } from '@microprojects/edm-components/hooks'
import { useGet } from '@microprojects/edm-components/hooks'
import type { RootState } from '../../store'
import { Detail } from '../MasterDetail'
import {
    Editor,
    EMPTY_GUID,
    Info,
} from '@microprojects/edm-components/components'
import './index'

type FolderProps = {
    onChange?: () => void
    onClose: MouseEventHandler
    path: string
    api: string
    type: string
}

// Normalise heterogeneous backend shapes ([{name}] vs ['Foo'] vs 'Foo') to a
// flat string[] so card + editor share one model.
function toGroupNames(groups: unknown): string[] {
    if (groups == null) return []
    if (Array.isArray(groups)) {
        return groups
            .map((g) =>
                typeof g === 'string'
                    ? g
                    : g && typeof g === 'object' && typeof (g as any).name === 'string'
                      ? (g as any).name
                      : null,
            )
            .filter((x): x is string => Boolean(x && x.trim()))
    }
    if (typeof groups === 'string') {
        return groups.trim() ? [groups.trim()] : []
    }
    return []
}

export function Folder(props: FolderProps) {
    const { t } = useTranslation('config')
    const user = useSelector((state: RootState) => state.user)
    const { id } = useParams()
    const entityToken = useEntityToken([{ type: props.type, id }])
    let [[data, setData], loading, error] = useGet<TreeNode>(
        `${props.api}/${id}`,
        [id, entityToken],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '', url: '' } as TreeNode
    }
    const cardGroups = useMemo(
        () => toGroupNames((data as any)?.groups),
        [data],
    )
    const restricted = cardGroups.length > 0
    const divisions = user?.divisions || []

    return (
        <Detail
            {...props}
            copyable={false}
            id={id}
            type="folder"
            icon={<FolderIcon />}
            loading={loading}
            error={error}
            data={data}
            card={
                <Info
                    content={
                        <Box>
                            <Properties>
                                <Property
                                    full
                                    label={t('folder.description')}
                                    value={data.description}
                                    multiline
                                />
                            </Properties>
                            <AccessBanner
                                restricted={restricted}
                                groups={cardGroups}
                            />
                        </Box>
                    }
                />
            }
            editor={
                <Editor
                    {...props}
                    type={props.type}
                    data={data}
                    setData={setData}
                    content={({ values, handleChange }) => {
                        const nameMissing =
                            !!values.id &&
                            (!values.name || !String(values.name).trim())
                        const identityFilled = [values.name, values.description]
                            .filter(
                                (v) => v && String(v).trim().length > 0,
                            ).length
                        const groupValues = toGroupNames(values.groups)

                        return (
                            <Box>
                                <EditorSection
                                    number={1}
                                    title={t('folder.identity')}
                                    filled={identityFilled}
                                    total={2}
                                    done={
                                        identityFilled === 2 && !nameMissing
                                    }
                                >
                                    <Field
                                        full
                                        name="name"
                                        label={t('folder.name')}
                                        required
                                        value={(values.name as string) ?? ''}
                                        onChange={handleChange}
                                        state={
                                            nameMissing ? 'invalid' : 'pristine'
                                        }
                                        help={
                                            nameMissing
                                                ? t('folder.nameMissing')
                                                : t('folder.nameHelp')
                                        }
                                    />
                                    <Field
                                        full
                                        kind="textarea"
                                        name="description"
                                        label={t('folder.description')}
                                        rows={2}
                                        value={
                                            (values.description as string) ??
                                            ''
                                        }
                                        onChange={handleChange}
                                    />
                                </EditorSection>

                                <AccessSection
                                    sectionNumber={2}
                                    groups={groupValues}
                                    divisions={divisions}
                                    onChange={(next) =>
                                        handleChange({
                                            target: {
                                                name: 'groups',
                                                value: next,
                                            },
                                        })
                                    }
                                />
                            </Box>
                        )
                    }}
                />
            }
        />
    )
}

function AccessBanner({
    restricted,
    groups,
}: { restricted: boolean; groups: string[] }) {
    const { t } = useTranslation('config')
    const Icon = restricted ? LockIcon : PublicIcon
    const tone = restricted ? 'var(--sig-warn-deep)' : 'var(--ink-3)'
    const bg = restricted ? 'var(--sig-warn-soft)' : 'var(--surface-2)'
    const border = restricted ? 'var(--sig-warn)' : 'var(--line)'
    return (
        <Box
            sx={{
                mt: 1.5,
                px: 1.25,
                py: 1,
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 'var(--r-2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
            }}
        >
            <Icon sx={{ fontSize: 18, color: tone, mt: '2px' }} />
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: tone,
                    }}
                >
                    {restricted
                        ? t('folder.restrictedAccess')
                        : t('folder.openToEveryone')}
                </Typography>
                {restricted ? (
                    <Box
                        sx={{
                            mt: 0.5,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                        }}
                    >
                        {groups.map((g) => (
                            <Chip
                                key={g}
                                label={g}
                                size="small"
                                sx={{
                                    height: 22,
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 11,
                                    background: 'var(--surface)',
                                    border: '1px solid var(--sig-warn)',
                                    color: 'var(--sig-warn-deep)',
                                }}
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography
                        variant="caption"
                        sx={{ color: 'var(--ink-3)' }}
                    >
                        {t('folder.openBanner')}
                    </Typography>
                )}
            </Box>
        </Box>
    )
}

interface AccessSectionProps {
    sectionNumber: number
    groups: string[]
    divisions: string[]
    onChange: (next: string[]) => void
}

function AccessSection({
    sectionNumber,
    groups,
    divisions,
    onChange,
}: AccessSectionProps) {
    const { t } = useTranslation('config')
    const restricted = groups.length > 0
    const Icon = restricted ? LockIcon : PublicIcon
    const tone = restricted ? 'var(--sig-warn-deep)' : 'var(--ink-3)'
    return (
        <EditorSection
            number={sectionNumber}
            title={t('folder.accessControl')}
            fillNote={
                restricted
                    ? t('folder.restrictedNote', { count: groups.length })
                    : t('folder.openNote')
            }
            done={false}
        >
            <Box sx={{ gridColumn: '1 / -1' }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mb: 0.75,
                    }}
                >
                    <Icon sx={{ fontSize: 16, color: tone }} />
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: tone,
                        }}
                    >
                        {t('folder.groups')}
                    </Typography>
                </Box>
                <Autocomplete
                    multiple
                    freeSolo
                    options={divisions}
                    value={groups}
                    onChange={(_, next) => onChange(next as string[])}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                {...getTagProps({ index })}
                                key={option}
                                label={option}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 12,
                                    background: 'var(--sig-warn-soft)',
                                    border: '1px solid var(--sig-warn)',
                                    color: 'var(--sig-warn-deep)',
                                    '& .MuiChip-deleteIcon': {
                                        color: 'var(--sig-warn-deep)',
                                    },
                                }}
                            />
                        ))
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={
                                restricted
                                    ? t('folder.addAnotherGroup')
                                    : t('folder.leaveEmptyOpen')
                            }
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    background: 'var(--surface)',
                                    fontSize: 13,
                                    minHeight: 'var(--field-h)',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: restricted
                                        ? 'var(--sig-warn)'
                                        : 'var(--line-strong)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--ink-3)',
                                },
                            }}
                        />
                    )}
                />
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        color: 'var(--ink-3)',
                        mt: 0.75,
                    }}
                >
                    <Trans
                        i18nKey="folder.emptyMeansEveryone"
                        ns="config"
                        components={[<b key="0" />]}
                    />
                </Typography>
            </Box>
        </EditorSection>
    )
}
