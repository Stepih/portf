import { ErrorMessage } from 'portfolio-ui';

// Toast-style form error. It is position: fixed, centered at the top of the
// viewport, and slides in when `error` is non-empty; an empty string hides it.
export const FormValidation = () => <ErrorMessage error="Заполните имя и способ связи" />;

export const SendFailed = () => (
  <ErrorMessage error="Не удалось отправить заявку. Попробуйте ещё раз через минуту" />
);
