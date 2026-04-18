import './ui.css'

export default function Card({
    hover,
    compact,
    as: Tag = 'div',
    className = '',
    children,
    ...rest
}) {
    const classes = [
        'card',
        compact && 'card-compact',
        hover && 'card-hover',
        className,
    ].filter(Boolean).join(' ')
    return <Tag className={classes} {...rest}>{children}</Tag>
}
