import React from 'react';
import { SvgIcon } from '@mui/material';

/**
 * Playing card diamond suit (♦) icon for poker/card games.
 * Simple rhombus shape - the classic card suit.
 */
export const DiamondSuitIcon = (props) => (
    <SvgIcon {...props} viewBox="0 0 24 24">
        <path d="M12 2l6 10-6 10-6-10 6-10z" />
    </SvgIcon>
);
