import { Substitute, default as substitute } from 'jssubstitute';

interface SubstituteEx<T> {
    
}

export type ISubstitute<T> = SubstituteEx<T> & T & Substitute;

