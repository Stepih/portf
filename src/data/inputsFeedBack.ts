import { IInput } from "@/interfaces/input";

interface IInputId extends IInput {
    id: number,
}
export const inputsListFeedback:IInputId[] = [
    {
        id: 1,
        inputKey: 'name',
        placeholder: 'Имя *',
        type: 'text',
    },
    {
        id: 2,
        inputKey: 'contact',
        placeholder: 'Телефон *',
        type: 'tel',
    }
]

// Кнопка отправки формы и ссылки на форму на /portfolio и в кейсах (CONVERSION_PLAN К1.4: скилл
// marketing:draft-content, выбор владельца). Лежит здесь, а не в offer.ts: форма – клиентский компонент,
// а offer.ts тянет за собой данные портфолио
export const formButton = 'Обсудить проект'
