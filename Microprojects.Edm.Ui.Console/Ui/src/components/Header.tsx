import { Box, Tooltip } from '@mui/material'
import { cleanName, type UserInfo } from '../api'

interface HeaderProps {
    user: UserInfo | null
}

// Mirrors Hub's doc-top: 56px sticky header with EDµ wordmark and right-aligned
// user name + role badge. The cobalt wash + 2px stripe is applied via the
// data-plugin="admin" attribute on .page-root (see app.css / schemes.html).
export function Header({ user }: HeaderProps) {
    const displayName = cleanName(user?.name ?? '')

    return (
        <Box component="header" className="doc-top">
            <a className="doc-brand" href="/console">
                <span className="brand-block">
                    <span className="ed">ED</span>
                    <span className="mu">µ</span>
                </span>
                <span className="brand-name">Console</span>
            </a>

            {displayName && (
                <Box className="header-user" sx={{ ml: 'auto' }}>
                    <Tooltip title={user?.name ?? ''} arrow placement="bottom-end">
                        <span className="user-name">{displayName}</span>
                    </Tooltip>
                    {user?.role && <span className="user-role">{user.role}</span>}
                </Box>
            )}
        </Box>
    )
}
