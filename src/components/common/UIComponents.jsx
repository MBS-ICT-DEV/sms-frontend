import { motion, AnimatePresence } from 'framer-motion';

export const LoadingSpinner = ({ size = 'md', dark = false }) => {
  const s = size === 'sm' ? 16 : size === 'lg' ? 36 : 22;
  return (
    <span style={{
      width: s, height: s, border: `2.5px solid ${dark ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.3)'}`,
      borderTopColor: dark ? 'var(--primary)' : '#fff',
      borderRadius: '50%', display: 'inline-block',
      animation: 'sms-spin 0.7s linear infinite',
    }} />
  );
};

export const StatCard = ({ icon, title, value, change, changeType = 'up', color = '#2563eb', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="sms-stat"
  >
    <div className="sms-stat-icon" style={{ background: color + '18', color }}>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
    </div>
    <div className="sms-stat-info">
      <div className="sms-stat-value">{value}</div>
      <div className="sms-stat-label">{title}</div>
      {change && <div className={`sms-stat-change ${changeType}`}>{changeType === 'up' ? '↑' : '↓'} {change}</div>}
import { X } from 'lucide-react';
import { useEffect } from 'react';

/* ─────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────── */

export const LoadingSpinner = ({ size = 'md', dark = false }) => {
  const s =
    size === 'sm'
      ? 16
      : size === 'lg'
        ? 36
        : 22;

  return (
    <span
      style={{
        width: s,
        height: s,
        border: `2.5px solid ${
          dark
            ? 'rgba(37,99,235,0.2)'
            : 'rgba(255,255,255,0.3)'
        }`,
        borderTopColor: dark ? 'var(--primary)' : '#fff',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'sms-spin 0.7s linear infinite',
      }}
      aria-label="Loading"
      role="status"
    />
  );
};


/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */

export const StatCard = ({
  icon,
  title,
  value,
  change,
  changeType = 'up',
  color = '#2563eb',
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      delay,
      duration: 0.35,
      ease: 'easeOut',
    }}
    className="sms-stat"
  >
    <div
      className="sms-stat-icon"
      style={{
        background: `${color}18`,
        color,
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>
        {icon}
      </span>
    </div>

    <div className="sms-stat-info">
      <div className="sms-stat-value">
        {value}
      </div>

      <div className="sms-stat-label">
        {title}
      </div>

      {change && (
        <div
          className={`sms-stat-change ${changeType}`}
        >
          <span>
            {changeType === 'up' ? '↑' : '↓'}
          </span>

          {change}
        </div>
      )}
    </div>
  </motion.div>
);

export const Button = ({ children, variant = 'primary', size = '', onClick, disabled, type = 'button', className = '', style = {} }) => (
  <button
    type={type} onClick={onClick} disabled={disabled}
    className={`sms-btn sms-btn-${variant} ${size ? `sms-btn-${size}` : ''} ${className}`}

/* ─────────────────────────────────────────────
   BUTTON
───────────────────────────────────────────── */

export const Button = ({
  children,
  variant = 'primary',
  size = '',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  style = {},
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`sms-btn sms-btn-${variant} ${
      size ? `sms-btn-${size}` : ''
    } ${className}`}
    style={style}
  >
    {children}
  </button>
);

export const Modal = ({ isOpen, onClose, title, children, size = '' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="sms-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`sms-modal ${size === 'lg' ? 'sms-modal-lg' : ''}`}
        >
          <div className="sms-modal-header">
            <span className="sms-modal-title">{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
          </div>
          <div className="sms-modal-body">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const Badge = ({ children, type = 'primary' }) => (
  <span className={`sms-badge sms-badge-${type}`}>{children}</span>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="sms-page-header">
    <div>
      <h1 className="sms-page-title">{title}</h1>
      {subtitle && <p className="sms-page-subtitle">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Card = ({ children, style = {} }) => (
  <div className="sms-card" style={style}>{children}</div>
);

export const EmptyState = ({ icon = '📭', text = 'No data found' }) => (
  <div className="sms-empty">
    <div className="sms-empty-icon">{icon}</div>
    <div className="sms-empty-text">{text}</div>
  </div>
);

export const Avatar = ({ name = 'U', color = '#2563eb', size = 'sm' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`sms-avatar ${size === 'lg' ? 'sms-avatar-lg' : ''}`}
      style={{ background: color + '22', color, border: `2px solid ${color}44` }}>
      {initials}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  showClose = true,
}) => {

  /* Close modal with ESC */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen, onClose]);


  /* Prevent background scrolling */
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [isOpen]);


  const sizeClass =
    {
      sm: 'sms-modal-sm',
      md: '',
      lg: 'sms-modal-lg',
      xl: 'sms-modal-xl',
    }[size] || '';


  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="sms-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              onClose?.();
            }
          }}
          role="presentation"
        >

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 24,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 16,
            }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`sms-modal ${sizeClass}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sms-modal-title"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}
            <div className="sms-modal-header">

              <div className="sms-modal-heading">
                <h2
                  id="sms-modal-title"
                  className="sms-modal-title"
                >
                  {title}
                </h2>
              </div>

              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="sms-modal-close"
                  aria-label="Close modal"
                >
                  <X size={19} />
                </button>
              )}

            </div>


            {/* BODY */}
            <div className="sms-modal-body">
              {children}
            </div>


            {/* FOOTER */}
            {footer && (
              <div className="sms-modal-footer">
                {footer}
              </div>
            )}

          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};


/* ─────────────────────────────────────────────
   BADGE
───────────────────────────────────────────── */

export const Badge = ({
  children,
  type = 'primary',
}) => (
  <span
    className={`sms-badge sms-badge-${type}`}
  >
    {children}
  </span>
);


/* ─────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────── */

export const PageHeader = ({
  title,
  subtitle,
  action,
}) => (
  <div className="sms-page-header">

    <div>
      <h1 className="sms-page-title">
        {title}
      </h1>

      {subtitle && (
        <p className="sms-page-subtitle">
          {subtitle}
        </p>
      )}
    </div>

    {action && (
      <div className="sms-page-header-action">
        {action}
      </div>
    )}

  </div>
);


/* ─────────────────────────────────────────────
   CARD
───────────────────────────────────────────── */

export const Card = ({
  children,
  style = {},
}) => (
  <div
    className="sms-card"
    style={style}
  >
    {children}
  </div>
);


/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */

export const EmptyState = ({
  icon = '📭',
  text = 'No data found',
}) => (
  <div className="sms-empty">

    <div className="sms-empty-icon">
      {icon}
    </div>

    <div className="sms-empty-text">
      {text}
    </div>

  </div>
);


/* ─────────────────────────────────────────────
   AVATAR
───────────────────────────────────────────── */

export const Avatar = ({
  name = 'U',
  color = '#2563eb',
  size = 'sm',
}) => {

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`sms-avatar ${
        size === 'lg'
          ? 'sms-avatar-lg'
          : ''
      }`}
      style={{
        background: `${color}22`,
        color,
        border: `2px solid ${color}44`,
      }}
    >
      {initials}
    </div>
  );
};
