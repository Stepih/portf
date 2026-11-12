import { FC } from "react";

import s from './Input.module.scss'

// Подпись над полем (DESIGN_FIXES_8_PLAN Д43): видна и после ввода. Звёздочка обязательного поля – только
// глазам, скринридер слышит «обязательное» из aria-required
const FieldLabel: FC<{ htmlFor: string; text: string; required?: boolean }> = ({ htmlFor, text, required }) => (
    <label htmlFor={htmlFor} className={s.label}>
        {text}
        {required && <span aria-hidden="true"> *</span>}
    </label>
)

export default FieldLabel
