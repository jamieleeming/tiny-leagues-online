import { styled } from '@mui/material/styles';
import {
    TableCell,
    TableRow,
    Box,
} from '@mui/material';

export const HeaderCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.mode === 'dark' 
        ? theme.palette.grey[800]
        : theme.palette.grey[100],
    fontSize: '0.875rem'
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.grey[100],
        cursor: 'pointer'
    }
}));

export const PlayerCell = styled(TableCell)(() => ({
    fontWeight: 500,
    fontSize: '0.875rem'
}));

export const NetCell = styled(TableCell)(({ theme, isPositive, isNegative }) => ({
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