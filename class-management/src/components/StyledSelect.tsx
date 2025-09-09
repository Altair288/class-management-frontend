"use client";

import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectProps,
  FormControlProps,
  Box,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// 定义颜色主题
const colorThemes = {
  primary: {
    main: '#4a5568',
    light: '#f8f9fa',
    border: '#e8eaed',
    borderHover: '#cbd5e0',
    background: 'white',
  },
  principal: {
    main: '#c53030',
    light: '#fff5f5',
    border: '#fed7d7',
    borderHover: '#feb2b2',
    background: 'white',
  },
  grade: {
    main: '#c05621',
    light: '#fffaf0',
    border: '#feebc8',
    borderHover: '#fbd38d',
    background: '#fafbfc',
  },
  department: {
    main: '#4a5568',
    light: '#f7fafc',
    border: '#e2e8f0',
    borderHover: '#cbd5e0',
    background: '#fafbfc',
  },
  class: {
    main: '#38a169',
    light: '#f0fff4',
    border: '#c6f6d5',
    borderHover: '#9ae6b4',
    background: '#fafbfc',
  },
};

const StyledFormControl = styled(FormControl)<{ theme_variant?: keyof typeof colorThemes; size_variant?: 'small' | 'medium' }>(
  ({ theme_variant = 'primary', size_variant = 'medium' }) => {
    const colors = colorThemes[theme_variant];
    const isSmall = size_variant === 'small';
    
    return {
      '& .MuiInputLabel-root': {
        color: '#718096',
        fontSize: '0.875rem',
        fontWeight: 500,
        transform: isSmall ? 'translate(14px, 10px) scale(1)' : 'translate(14px, 16px) scale(1)',
        '&.Mui-focused': {
          color: colors.main,
        },
        '&.MuiInputLabel-shrink': {
          transform: 'translate(14px, -6px) scale(0.75)',
        },
      },
      '& .MuiOutlinedInput-root': {
        backgroundColor: colors.background,
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 500,
        minHeight: isSmall ? '40px' : '56px',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          backgroundColor: colors.light,
        },
        '&.Mui-focused': {
          backgroundColor: colors.background,
          boxShadow: `0 0 0 2px ${colors.main}20`,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.border,
          borderWidth: '1px',
          transition: 'border-color 0.2s ease-in-out',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.borderHover,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.main,
          borderWidth: '2px',
        },
        '& .MuiSelect-icon': {
          color: '#a0aec0',
          transition: 'transform 0.2s ease-in-out',
        },
        '&.Mui-focused .MuiSelect-icon': {
          transform: 'rotate(180deg)',
          color: colors.main,
        },
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          padding: isSmall ? '8.5px 14px' : '16.5px 14px',
        },
      },
    };
  }
);

const StyledMenuItem = styled(MenuItem)<{ theme_variant?: keyof typeof colorThemes }>(
  ({ theme_variant = 'primary' }) => {
    const colors = colorThemes[theme_variant];
    return {
      fontSize: '0.875rem',
      fontWeight: 500,
      padding: '12px 16px',
      margin: '2px 8px',
      borderRadius: '8px',
      transition: 'all 0.15s ease-in-out',
      '&:hover': {
        backgroundColor: colors.light,
        color: colors.main,
      },
      '&.Mui-selected': {
        backgroundColor: `${colors.main}15`,
        color: colors.main,
        fontWeight: 600,
        '&:hover': {
          backgroundColor: `${colors.main}25`,
        },
      },
    };
  }
);

export interface StyledSelectProps extends Omit<SelectProps, 'variant'> {
  label?: string;
  themeVariant?: keyof typeof colorThemes;
  formControlProps?: Omit<FormControlProps, 'children'>;
}

export interface SelectOption {
  value: string | number;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const StyledSelect: React.FC<StyledSelectProps> = ({
  label,
  themeVariant = 'primary',
  formControlProps,
  children,
  size = 'medium',
  value,
  onChange,
  ...selectProps
}) => {
  const colors = colorThemes[themeVariant];

  return (
    <StyledFormControl
      theme_variant={themeVariant}
      size_variant={size as 'small' | 'medium'}
      size={size}
      fullWidth
      {...formControlProps}
    >
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        label={label}
        size={size}
        value={value}
        onChange={onChange}
        IconComponent={ExpandMoreIcon}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              mt: 0.5,
              maxHeight: '300px',
              '& .MuiList-root': {
                padding: '4px',
              },
            },
          },
        }}
        {...selectProps}
      >
        {children}
      </Select>
    </StyledFormControl>
  );
};

// 预设选项组件
export const StyledMenuItem_Custom: React.FC<{
  value: string | number;
  themeVariant?: keyof typeof colorThemes;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  subtitle?: string;
  disabled?: boolean;
}> = ({ 
  value, 
  themeVariant = 'primary', 
  icon, 
  children, 
  subtitle, 
  disabled = false 
}) => (
  <StyledMenuItem 
    value={value} 
    theme_variant={themeVariant}
    disabled={disabled}
  >
    {icon || children ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        {icon && (
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: `${colorThemes[themeVariant].main}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
            {children}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    ) : (
      children
    )}
  </StyledMenuItem>
);

// 空状态选项
export const EmptyMenuItem: React.FC<{
  themeVariant?: keyof typeof colorThemes;
  children?: React.ReactNode;
}> = ({ themeVariant = 'primary', children = '未指派' }) => (
  <StyledMenuItem value="" theme_variant={themeVariant}>
    <em style={{ color: '#a0aec0' }}>{children}</em>
  </StyledMenuItem>
);

export default StyledSelect;
