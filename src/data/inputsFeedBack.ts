import { IInput } from "@/interfaces/input";

interface IInputId extends IInput {
    id: number,
}
export const inputsListFeedback:IInputId[] = [
    {
        id: 1,
        inputKey: 'name',
        placeholder: 'Имя',
        type: 'text',
    },
    {
        id: 2,
        inputKey: 'contact',
        placeholder: 'Телефон',
        type: 'tel',
    }
]