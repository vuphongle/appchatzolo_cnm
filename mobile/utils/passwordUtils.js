export const isPasswordValid = (password) => {
    const lowercaseRegex = /[a-z]/;
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
    const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;

    return (
        lowercaseRegex.test(password) &&
        uppercaseRegex.test(password) &&
        numberRegex.test(password) &&
        specialCharacterRegex.test(password) &&
        password.length >= 8
    );
};