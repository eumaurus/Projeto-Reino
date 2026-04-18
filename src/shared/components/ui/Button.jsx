import './ui.css'

export default function Button({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    block,
    loading,
    disabled,
    children,
    className = '',
    ...rest
}) {
    const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        block && 'btn-block',
        className,
    ].filter(Boolean).join(' ')

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...rest}
        >
            {loading
                ? <span className="btn-spinner" />
                : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
            {children}
            {IconRight && !loading && <IconRight size={size === 'sm' ? 14 : 16} />}
        </button>
    )
}
