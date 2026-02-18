import { styled } from '@mui/material/styles';
import {
    TableCell,
    TableRow,
    Box,
} from '@mui/material';

export const HeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(39, 39, 42, 0.6)'
        : 'rgba(0, 0, 0, 0.02)',
    fontSize: '0.8125rem',
    color: theme.palette.text.secondary,
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: '12px 16px'
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(0, 0, 0, 0.02)'
    }
}));

export const PlayerCell = styled(TableCell)(() => ({
    fontWeight: 500,
    fontSize: '0.875rem',
    padding: '14px 16px'
}));

export const NetCell = styled(TableCell, {
    shouldForwardProp: (prop) => prop !== 'isPositive' && prop !== 'isNegative',
})(({ theme, isPositive, isNegative }) => ({
    color: isPositive 
        ? theme.palette.success.main 
        : isNegative 
            ? theme.palette.error.main 
            : 'inherit',
    fontWeight: 'bold',
    fontSize: '0.875rem'
}));

export const NetAmountBox = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px'
})); 