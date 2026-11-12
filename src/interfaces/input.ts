export interface IInput {
    inputKey: keyof IInputKeyValue,

    // Подпись над полем (DESIGN_FIXES_8_PLAN Д43); в чате – подсказка внутри поля
    label: string,
    required?: boolean,
    type: 'text' | 'tel'
}

export interface IInputKeyValue {
    name: string;
    contact: string;
}
