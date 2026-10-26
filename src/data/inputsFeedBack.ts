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

// Плашка вместо формы после отправки и ошибка короткого номера (DESIGN_FIXES_2_PLAN Д6: скилл
// marketing:draft-content, выбор владельца – вариант C2 и «с примером»). Про предоплату здесь не пишем (владелец)
export const formSuccessTitle = (name: string) => `${name}, заявка отправлена`
export const formSuccessText = 'Отвечу в течение часа и договоримся о бесплатном созвоне. На нём обсудим задачу, назову цену и срок.'
// В номере неразрывные пробелы и ⁠ после дефисов: пример не рвётся на две строки
export const phoneTooShort = 'Введите номер целиком, например +7 999 123-⁠45-⁠67'

// Подпись выбранной услуги над полями формы: «Вы выбрали: Лендинг · от 8 000 ₽ · 3–4 дня»
// (DESIGN_FIXES_3_PLAN Д13: скилл marketing:draft-content, выбор владельца)
export const formServiceLabel = 'Вы выбрали:'

// Ошибка поля «Имя»: набран недопустимый символ (DESIGN_FIXES_3_PLAN Д14: скилл marketing:draft-content,
// выбор владельца – вариант A). Про длину не пишем: больше FEEDBACK_LIMITS.name поле набрать не даёт
export const nameFormatError = 'Формат: буквы, пробел, дефис и апостроф'
export const phoneFormatError = 'Формат: цифры, +, скобки и дефис, не больше 25 символов'

// Ошибки пустых полей – под своим полем, а не общей плашкой (DESIGN_FIXES_6_PLAN Д31: скилл
// marketing:draft-content, выбор владельца – вариант A)
export const nameEmptyError = 'Введите имя'
export const phoneEmptyError = 'Введите телефон'
