export const Dateformatter = (date: string) => {
    if (Object.is(date, null)) {
        return null;
    }
    const inputDate = new Date(date);
    const updatedDate = `${inputDate.getFullYear()}-${inputDate.getMonth()}-${inputDate.getDate()}`;
    return updatedDate;
};

export const titleCase = (inputString: string) => {
    const splitStr = inputString.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
};
