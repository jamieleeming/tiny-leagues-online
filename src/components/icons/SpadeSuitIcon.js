import React from 'react';
import { SvgIcon } from '@mui/material';

/**
 * Playing card spade suit (♠) icon - renders the Unicode character for exact match.
 */
export const SpadeSuitIcon = (props) => (
    <SvgIcon {...props} viewBox="0 0 24 24">
        <text
            x="12"
            y="12"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
                fontFamily: 'serif',
                fontSize: 38,
                fontWeight: 'bold',
                fill: 'currentColor',
            }}
        >
            ♠
        </text>
    </SvgIcon>
);
