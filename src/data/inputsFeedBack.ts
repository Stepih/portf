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
        placeholder: 'Телефон или Telegram *',
        type: 'text',
    }
]

// Кнопка отправки формы и ссылки на форму на /portfolio и в кейсах (CONVERSION_PLAN К1.4: скилл
// marketing:draft-content, выбор владельца). Лежит здесь, а не в offer.ts: форма – клиентский компонент,
// а offer.ts тянет за собой данные портфолио
export const formButton = 'Обсудить проект'

// Плашка вместо формы после отправки (DESIGN_FIXES_2_PLAN Д6: скилл
// marketing:draft-content, выбор владельца – вариант C2 и «с примером»). Про предоплату здесь не пишем (владелец)
export const formSuccessTitle = (name: string) => `${name}, заявка отправлена`
export const formSuccessText = 'Отвечу в течение часа и договоримся о бесплатном созвоне. На нём обсудим задачу, назову цену и срок.'
// Ошибка контакта, который не похож ни на номер, ни на ник (SALES_PLAN 4.2: скилл marketing:draft-content, выбор владельца)
export const contactIncomplete = 'Нужен номер целиком или ник, например @ivan_petrov'

// Тип проекта в форме (SALES_PLAN 4.2: скилл marketing:draft-content, выбор владельца): чипы с услугами из offer.ts
// и «Другое», выбор необязателен. Услуга из ссылки «Узнать цену» выбрана заранее
export const formServiceTitle = 'Что нужно'
export const formServiceOther = { id: 'other', title: 'Другое' } as const

// Ошибка поля «Имя»: набран недопустимый символ (DESIGN_FIXES_3_PLAN Д14: скилл marketing:draft-content,
// выбор владельца – вариант A). Про длину не пишем: больше FEEDBACK_LIMITS.name поле набрать не даёт
export const nameFormatError = 'Формат: буквы, пробел, дефис и апостроф'
// В номере неразрывные пробелы и ⁠ после дефисов: пример не рвётся на две строки
export const contactFormatError = 'Формат: +7 999 123-⁠45-⁠67 или @nick'

// Ошибки пустых полей – под своим полем, а не общей плашкой (DESIGN_FIXES_6_PLAN Д31: скилл
// marketing:draft-content, выбор владельца – вариант A)
export const nameEmptyError = 'Введите имя'
export const contactEmptyError = 'Введите телефон или Telegram'
