import { useTranslation } from 'react-i18next'

interface GreetingProps {
    userName: string
}

export function Greeting({ userName }: GreetingProps) {
    const { t } = useTranslation('hub')
    const suffix = userName ? `, ${userName}` : ''
    return <p className="greeting">{t('greeting', { suffix })}</p>
}
