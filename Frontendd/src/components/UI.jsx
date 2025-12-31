import React from 'react'
import { 
  Card as MuiCard, 
  CardHeader, 
  CardContent, 
  CardActions, 
  Button as MuiButton, 
  Table as MuiTable, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from '@mui/material';
import { styled } from '@mui/material/styles';

export function Card({ title, subtitle, children, footer, accent, className, sx, contentSx, ...rest }) {
  const baseSx = {
    background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
    border: '1px solid var(--border)',
    borderRadius: 3,
    boxShadow: 'var(--shadow)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 30px rgba(93, 64, 55, 0.15)'
    },
    transition: 'all 0.3s ease',
    ...(accent ? {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, var(--brand), var(--brand-2))'
      }
    } : {})
  };

  const combinedSx = Array.isArray(sx)
    ? [baseSx, ...sx]
    : sx
    ? [baseSx, sx]
    : baseSx;

  return (
    <MuiCard 
      className={className}
      sx={combinedSx}
      {...rest}
    >
      {(title || subtitle) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          sx={{
            background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
            borderBottom: '1px solid var(--border)',
            '& .MuiCardHeader-title': {
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text)'
            },
            '& .MuiCardHeader-subheader': {
              color: 'var(--muted)',
              fontSize: '0.9rem'
            }
          }}
        />
      )}
      <CardContent 
        sx={{ 
          padding: 3,
          flex: '1 1 auto', 
          display: 'block',
          width: '100%',
          ...(Array.isArray(contentSx) ? Object.assign({}, ...contentSx) : (contentSx ?? {})),
        }}
      >
        {children}
      </CardContent>
      {footer && (
        <CardActions 
          sx={{ 
            padding: 2, 
            borderTop: '1px solid var(--border)',
            background: 'transparent'
          }}
        >
          {footer}
        </CardActions>
      )}
    </MuiCard>
  )
}

export function Field({ label, placeholder = '', type = 'text', hint, inline, options }) {
  return (
    <label className={`field ${inline ? 'inline' : ''}`}>
      <span className="field-label">{label}</span>
      {type === 'select' ? (
        <select disabled>
          {(options ?? []).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea placeholder={placeholder} disabled rows={3} />
      ) : (
        <input type={type} placeholder={placeholder} disabled />
      )}
      {hint && <small className="muted">{hint}</small>}
    </label>
  )
}

export function Toolbar({ children, className, style }) {
  return (
    <div 
      className={`toolbar ${className ?? ''}`}
      style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem',
        flexWrap: 'wrap',
        ...(style || {})
      }}
    >
      {children}
    </div>
  )
}

const StyledButton = styled(MuiButton)(({ variant, size }) => ({
  height: size === 'small' ? '36px' : '48px',
  minHeight: size === 'small' ? '36px' : '48px',
  padding: size === 'small' ? '0 0.75rem' : '0 1.25rem',
  borderRadius: '8px',
  fontSize: size === 'small' ? '0.875rem' : '0.95rem',
  fontWeight: 500,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  gap: '0.5rem',
  ...(variant === 'primary' && {
    background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
    color: '#fff',
    border: '2px solid transparent',
    '&:hover': {
      background: 'linear-gradient(135deg, var(--brand-2), var(--brand))',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(93, 64, 55, 0.2)'
    }
  }),
  ...(variant === 'ghost' && {
    background: 'transparent',
    border: '2px solid var(--border)',
    color: 'var(--text)',
    '&:hover': {
      background: 'var(--accent)',
      borderColor: 'var(--brand)'
    }
  })
}));

export function Button({ children, variant = 'primary', small, disabled = false, ...rest }) {
  return (
    <StyledButton
      variant={variant === 'ghost' ? 'outlined' : 'contained'}
      size={small ? 'small' : 'medium'}
      disabled={disabled}
      {...rest}
    >
      {children}
    </StyledButton>
  )
}

export function Table({ columns = [], rows = [], footer, className }) {
  return (
    <div className={`table-wrap${className ? ` ${className}` : ''}`}>
      <MuiTable size="small" sx={{ 
        background: 'var(--panel)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.12)',
        '& .MuiTableHead-root': {
          '& .MuiTableCell-head': {
            background: 'linear-gradient(120deg, rgba(119, 80, 65, 0.88), rgba(122, 94, 82, 0.88))',
            color: '#FDFBF9',
            fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.18)',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            letterSpacing: '0.02em',

            padding: { xs: '0.55rem 0.7rem', sm: '0.75rem 1rem', md: '0.9rem 1.2rem' },
            '&:last-of-type': {
              borderRight: 'none'
            }
          }
        },
        '& .MuiTableCell-body': {
          fontSize: { xs: '0.75rem', sm: '0.9rem', md: '0.95rem' },
          padding: { xs: '0.55rem 0.7rem', sm: '0.75rem 1rem', md: '0.9rem 1.2rem' },
          color: 'var(--text)',
          borderBottom: '1px solid var(--border)',
          whiteSpace: { xs: 'nowrap', sm: 'normal' },
        },
      }}>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index}>{column}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ color: 'var(--muted)', py: 3 }}>
                Sin datos
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    data-label={columns[cellIndex] ?? ''}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </MuiTable>
      {footer && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--panel-2)' }}>
          {footer}
        </div>
      )}
    </div>
  )
}
