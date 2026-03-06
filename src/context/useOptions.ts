import { useContext } from 'react';
import { OptionContext } from './sharedOptionContext';

export const useOptions = () => {
    const context = useContext(OptionContext);

    if (!context) {
        throw new Error('useOptions must be used within OptionProvider');
    }

    return context;
};
