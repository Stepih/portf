export interface IInput {
    inputKey: keyof IInputKeyValue,
    
    placeholder?: string,
    type: 'text' | 'tel'
}

export interface IInputKeyValue {
    name: string;
    contact: string;
}