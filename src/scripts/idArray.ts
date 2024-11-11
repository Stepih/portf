export const stepIdNewArray = (array: any[]) => {
    const ids:number[] = []
    array.forEach(element => {
        ids.push(element?.id)
    });
    return ids
}